import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { existsSync } from 'fs';
import { resolve } from 'path';
import envConfig from './config/env.config';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { StoreModule } from './modules/store/store.module';
import { CategoryModule } from './modules/category/category.module';
import { UnitModule } from './modules/unit/unit.module';
import { IngredientModule } from './modules/ingredient/ingredient.module';
import { AllergenModule } from './modules/allergen/allergen.module';
import { ProductModule } from './modules/product/product.module';
import { MenuModule } from './modules/menu/menu.module';
import { TableModule } from './modules/table/table.module';
import { OrderModule } from './modules/order/order.module';
import { CartModule } from './modules/cart/cart.module';
import { PaymentModule } from './modules/payment/payment.module';
import { NotificationModule } from './modules/notification/notification.module';
import { CustomerModule } from './modules/customer/customer.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { StockModule } from './modules/stock/stock.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { ReportModule } from './modules/report/report.module';
import { UploadModule } from './modules/upload/upload.module';
import { I18nModule } from './modules/i18n/i18n.module';
import { StaffModule } from './modules/staff/staff.module';
import { EventsGateway } from './gateway/events.gateway';

const envFilePath = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../../.env'),
  resolve(__dirname, '../../../.env'),
  resolve(__dirname, '../../../../.env'),
].filter((path, index, paths) => existsSync(path) && paths.indexOf(path) === index);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
      load: [envConfig as any],
    }),
    AuthModule,
    OrganizationModule,
    StoreModule,
    CategoryModule,
    UnitModule,
    IngredientModule,
    AllergenModule,
    ProductModule,
    MenuModule,
    TableModule,
    OrderModule,
    CartModule,
    PaymentModule,
    NotificationModule,
    CustomerModule,
    CampaignModule,
    StockModule,
    KitchenModule,
    ReportModule,
    UploadModule,
    I18nModule,
    StaffModule,
  ],
  providers: [EventsGateway],
})
export class AppModule {}
