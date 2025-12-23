import {
    Injectable,
    OnApplicationBootstrap,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './user.entity';
import { Role } from './role.enum';
import { CryptoService } from '../../common/services/crypto.service';

@Injectable()
export class UserBootstrapService implements OnApplicationBootstrap {
    private readonly logger = new Logger(UserBootstrapService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService,
        private readonly cryptoService: CryptoService,
    ) { }

    async onApplicationBootstrap() {
        await this.syncAdminUser();
    }

    private async syncAdminUser() {
        const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
        const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

        if (!adminEmail || !adminPassword) {
            this.logger.warn(
                'Variables ADMIN_EMAIL and/or ADMIN_PASSWORD not defined. Skipping admin synchronization.',
            );
            return;
        }

        try {
            // Find user by email first to update the specific configured admin
            let adminUser = await this.userRepository.findOne({
                where: { email: adminEmail },
            });

            // If found but not ADMIN, upgrade it (or warn?) - upgrading for now
            if (adminUser) {
                let changed = false;

                // Ensure Role is ADMIN (or SUPER_ADMIN if we had that distinction in logic, but here assume ADMIN target)
                // If user is already SUPER_ADMIN, maybe don't downgrade? Let's ensure at least ADMIN.
                if (adminUser.role !== Role.ADMIN && adminUser.role !== Role.SUPER_ADMIN) {
                    adminUser.role = Role.ADMIN;
                    changed = true;
                    this.logger.log(`Upgrading user ${adminEmail} to ADMIN.`);
                }

                // Check Password
                const isPasswordValid = await this.cryptoService.comparePassword(adminPassword, adminUser.password);
                if (!isPasswordValid) {
                    adminUser.password = await this.cryptoService.hashPassword(adminPassword);
                    changed = true;
                    this.logger.log(`Updating password for admin ${adminEmail} from environment variable.`);
                }

                if (changed) {
                    await this.userRepository.save(adminUser);
                    this.logger.log(`Admin user ${adminEmail} synchronized successfully.`);
                } else {
                    this.logger.debug(`Admin user ${adminEmail} is already up to date.`);
                }

            } else {
                // If not found by email, check if ANY admin exists to avoid multiple admins if not intended?
                // The requirement is to ensure *this* admin exists.
                // So we create it.
                this.logger.log(`Creating initial admin user: ${adminEmail}`);

                const hashedPassword = await this.cryptoService.hashPassword(adminPassword);

                adminUser = this.userRepository.create({
                    email: adminEmail,
                    name: 'System Admin',
                    password: hashedPassword,
                    role: Role.ADMIN,
                    isActive: true,
                });

                await this.userRepository.save(adminUser);
                this.logger.log('Initial admin user created successfully.');
            }

        } catch (error) {
            this.logger.error('Error synchronizing admin user', error);
        }
    }
}
