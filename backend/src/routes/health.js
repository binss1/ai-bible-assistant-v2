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
        claude: process.env.CLAUDE_API_KEY ? 'configured' : 'not-configured',
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
        hasMongoUri: !!process.env.MONGODB_URI
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
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
