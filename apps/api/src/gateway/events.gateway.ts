import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: any;

  private logger = new Logger('EventsGateway');

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: any) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Join a store room (for staff dashboard, kitchen display, etc.)
  @SubscribeMessage('joinStore')
  handleJoinStore(
    @ConnectedSocket() client: any,
    @MessageBody() data: { storeId: string },
  ) {
    client.join(`store:${data.storeId}`);
    this.logger.log(`Client ${client.id} joined store:${data.storeId}`);
    return { event: 'joinedStore', data: { storeId: data.storeId } };
  }

  // Leave a store room
  @SubscribeMessage('leaveStore')
  handleLeaveStore(
    @ConnectedSocket() client: any,
    @MessageBody() data: { storeId: string },
  ) {
    client.leave(`store:${data.storeId}`);
    return { event: 'leftStore', data: { storeId: data.storeId } };
  }

  // Join kitchen room
  @SubscribeMessage('joinKitchen')
  handleJoinKitchen(
    @ConnectedSocket() client: any,
    @MessageBody() data: { storeId: string },
  ) {
    client.join(`kitchen:${data.storeId}`);
    this.logger.log(`Client ${client.id} joined kitchen:${data.storeId}`);
    return { event: 'joinedKitchen', data: { storeId: data.storeId } };
  }

  // Join a table session (for customers at a specific table)
  @SubscribeMessage('joinTable')
  handleJoinTable(
    @ConnectedSocket() client: any,
    @MessageBody() data: { tableId: string; sessionId: string },
  ) {
    client.join(`table:${data.tableId}`);
    return { event: 'joinedTable', data };
  }

  // Waiter call from customer
  @SubscribeMessage('callWaiter')
  handleCallWaiter(
    @ConnectedSocket() client: any,
    @MessageBody() data: { storeId: string; tableId: string; tableName: string },
  ) {
    this.server.to(`store:${data.storeId}`).emit('waiterCall', {
      tableId: data.tableId,
      tableName: data.tableName,
      timestamp: new Date().toISOString(),
    });
    return { event: 'waiterCalled', data };
  }

  // Request bill from customer
  @SubscribeMessage('requestBill')
  handleRequestBill(
    @ConnectedSocket() client: any,
    @MessageBody() data: { storeId: string; tableId: string; tableName: string },
  ) {
    this.server.to(`store:${data.storeId}`).emit('billRequest', {
      tableId: data.tableId,
      tableName: data.tableName,
      timestamp: new Date().toISOString(),
    });
    return { event: 'billRequested', data };
  }

  // --- Server-side emit methods (called from services) ---

  sendToStore(storeId: string, event: string, data: any) {
    this.server.to(`store:${storeId}`).emit(event, data);
  }

  sendToKitchen(storeId: string, event: string, data: any) {
    this.server.to(`kitchen:${storeId}`).emit(event, data);
  }

  sendToTable(tableId: string, event: string, data: any) {
    this.server.to(`table:${tableId}`).emit(event, data);
  }

  // Emit new order to kitchen and store
  emitNewOrder(storeId: string, order: any) {
    this.sendToStore(storeId, 'newOrder', order);
    this.sendToKitchen(storeId, 'newOrder', order);
  }

  // Emit order status update
  emitOrderStatusUpdate(storeId: string, order: any) {
    this.sendToStore(storeId, 'orderStatusUpdate', order);
    this.sendToKitchen(storeId, 'orderStatusUpdate', order);

    // Also notify the customer at the table
    if (order.tableSession?.tableId) {
      this.sendToTable(order.tableSession.tableId, 'orderStatusUpdate', order);
    }
  }
}
