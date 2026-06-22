import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: '统一认证服务',
      version: '2.0.0',
      docs: '/api',
    };
  }
}
