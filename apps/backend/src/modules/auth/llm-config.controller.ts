import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LLMConfigService, CreateLLMConfigDto, UpdateLLMConfigDto } from './llm-config.service';

@Controller('llm-config')
@UseGuards(JwtAuthGuard)
export class LLMConfigController {
  constructor(private llmConfigService: LLMConfigService) {}

  /**
   * Get all LLM configurations for the authenticated user
   */
  @Get()
  async getUserConfigs(@Request() req) {
    return this.llmConfigService.getUserConfigs(req.user.id);
  }

  /**
   * Get a specific LLM configuration
   */
  @Get(':id')
  async getConfig(@Request() req, @Param('id') id: string) {
    return this.llmConfigService.getConfig(req.user.id, id);
  }

  /**
   * Create or update LLM configuration
   */
  @Post()
  async saveConfig(@Request() req, @Body() dto: CreateLLMConfigDto) {
    return this.llmConfigService.saveConfig(req.user.id, dto);
  }

  /**
   * Update LLM configuration
   */
  @Put(':id')
  async updateConfig(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateLLMConfigDto,
  ) {
    return this.llmConfigService.updateConfig(req.user.id, id, dto);
  }

  /**
   * Delete LLM configuration
   */
  @Delete(':id')
  async deleteConfig(@Request() req, @Param('id') id: string) {
    await this.llmConfigService.deleteConfig(req.user.id, id);
    return { message: 'Configuration deleted successfully' };
  }

  /**
   * Test if API key is valid
   */
  @Post(':id/test')
  async testApiKey(@Request() req, @Param('id') id: string) {
    return this.llmConfigService.testApiKey(req.user.id, id);
  }
}
