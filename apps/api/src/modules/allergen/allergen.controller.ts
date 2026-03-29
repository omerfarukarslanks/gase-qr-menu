import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AllergenService } from './allergen.service';
import { CreateAllergenDto, UpdateAllergenDto } from './dto/allergen.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('allergens')
@Controller('api/allergens')
export class AllergenController {
  constructor(private readonly allergenService: AllergenService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create an allergen' })
  create(@Body() dto: CreateAllergenDto) {
    return this.allergenService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all allergens (public)' })
  findAll() {
    return this.allergenService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get allergen by ID' })
  findOne(@Param('id') id: string) {
    return this.allergenService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update allergen' })
  update(@Param('id') id: string, @Body() dto: UpdateAllergenDto) {
    return this.allergenService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete allergen' })
  remove(@Param('id') id: string) {
    return this.allergenService.remove(id);
  }
}
