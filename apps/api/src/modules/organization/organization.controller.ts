import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Create a new organization' })
  create(@CurrentUser('id') ownerId: string, @Body() dto: CreateOrganizationDto) {
    return this.organizationService.create(dto, ownerId);
  }

  @Get()
  @ApiOperation({ summary: 'List all organizations' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.organizationService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  findOne(@Param('id') id: string) {
    return this.organizationService.findOne(id);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Update organization' })
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.organizationService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Soft delete organization' })
  remove(@Param('id') id: string) {
    return this.organizationService.remove(id);
  }
}
