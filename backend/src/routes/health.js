const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// 기본 헬스 체크
router.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100
      },
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        name: mongoose.connection.name || 'unknown'
      },
      services: {
        claude: {
          status: process.env.CLAUDE_API_KEY ? 'configured' : 'not-configured',
          keyLength: process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.length : 0,
          keyPrefix: process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.substring(0, 10) + '...' : 'none'
        },
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
      }
    };

    // 데이터베이스 연결 확인
    if (mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.db.admin().ping();
        healthCheck.database.ping = 'success';
      } catch (dbError) {
        healthCheck.database.ping = 'failed';
        healthCheck.database.error = dbError.message;
        healthCheck.status = 'WARNING';
      }
    } else {
      healthCheck.status = 'ERROR';
      healthCheck.database.error = 'Database not connected';
    }

    const statusCode = healthCheck.status === 'OK' ? 200 : 
                      healthCheck.status === 'WARNING' ? 200 : 503;

    res.status(statusCode).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Claude API 키 테스트 엔드포인트
router.get('/test-claude', async (req, res) => {
  try {
    if (!process.env.CLAUDE_API_KEY) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'CLAUDE_API_KEY가 설정되지 않았습니다.',
        instructions: {
          step1: 'Render 대시보드에서 Environment Variables 설정',
          step2: 'CLAUDE_API_KEY 변수 추가',
          step3: 'Claude API 키는 sk-ant-api03-로 시작해야 함',
          step4: '서비스 재배포 후 다시 테스트'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Claude 서비스 테스트
    const ClaudeService = require('../services/ClaudeService');
    const claudeService = new ClaudeService();
    
    const testResponse = await claudeService.generateResponse(
      '안녕하세요, API 연결 테스트입니다.',
      { counselingStage: 'greeting' }
    );

    res.json({
      status: 'OK',
      message: 'Claude AI 연결 성공! 🎉',
      test: {
        input: '안녕하세요, API 연결 테스트입니다.',
        output: testResponse.content.substring(0, 200) + '...',
        usage: testResponse.usage,
        model: testResponse.model
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Claude API 테스트 실패',
      error: error.message,
      troubleshooting: {
        '401 Unauthorized': 'API 키가 잘못되었거나 만료됨',
        '429 Too Many Requests': 'API 요청 한도 초과',
        '500 Internal Server Error': 'Claude API 서버 문제',
        'ENOTFOUND': '네트워크 연결 문제'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// 상세 시스템 정보
router.get('/health/detailed', async (req, res) => {
  try {
    const detailed = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      system: {
        platform: process.platform,
        architecture: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
        uptime: process.uptime(),
        cpuUsage: process.cpuUsage(),
        memoryUsage: process.memoryUsage()
      },
      database: {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
        collections: {}
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        hasClaudeKey: !!process.env.CLAUDE_API_KEY,
        claudeKeyLength: process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.length : 0,
        hasMongoUri: !!process.env.MONGODB_URI,
        corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
      }
    };

    // 컬렉션 정보 조회
    if (mongoose.connection.readyState === 1) {
      try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const collection of collections) {
          try {
            const count = await mongoose.connection.db.collection(collection.name).countDocuments();
            detailed.database.collections[collection.name] = {
              count: count,
              type: collection.type || 'collection'
            };
          } catch (countError) {
            detailed.database.collections[collection.name] = {
              error: countError.message
            };
          }
        }
      } catch (listError) {
        detailed.database.collectionsError = listError.message;
      }
    }

    res.json(detailed);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 데이터베이스 연결 테스트
router.get('/health/database', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'ERROR',
        message: 'Database not connected',
        readyState: mongoose.connection.readyState
      });
    }

    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    const responseTime = Date.now() - start;

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        responseTime: `${responseTime}ms`,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API 버전 정보
router.get('/version', (req, res) => {
  res.json({
    name: 'AI Bible Assistant Backend',
    version: process.env.npm_package_version || '1.0.0',
    description: '성경의 지혜로 상담해주는 AI Assistant',
    author: 'binss1',
    repository: 'https://github.com/binss1/ai-bible-assistant-v2',
    ai: {
      claude: {
        model: 'claude-3-sonnet-20240229',
        configured: !!process.env.CLAUDE_API_KEY,
        purpose: '영적 상담 및 성경 기반 조언'
      }
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
