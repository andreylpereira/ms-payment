import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreditCard, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CreditCardService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('NOTIFICATION_SERVICE') private rabbitClient: ClientProxy,
  ) {}

  async create(data: Prisma.CreditCardCreateInput): Promise<CreditCard> {
    const creditCard = await this.prisma.creditCard.create({ data });

    this.sendPaymentNotification(JSON.stringify(creditCard), 'register');
    
    this.processPayment(creditCard);
    return creditCard;
  }

  async processPayment(payment: CreditCard) {
    setTimeout(
      () => this.sendPaymentNotification(JSON.stringify(payment), 'confirmation'),
      5000
    );
  }

  sendPaymentNotification(message: string, type: string) {
    try {
      this.rabbitClient.emit(type, {
        id: randomUUID(),
        data: {
          notification: message,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }


}
