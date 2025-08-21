import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import PrayerGeneration from './components/PrayerGeneration';
import './index.css';

function App() {
  const [currentPage, setCurrentPage] = useState('chat');

  return (
    <div className="App min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-blue-600">
              🙏 AI Bible Assistant
            </h1>
            <nav className="flex space-x-4">
              <button
                onClick={() => setCurrentPage('chat')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'chat'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                AI 상담
              </button>
              <button
                onClick={() => setCurrentPage('prayer')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'prayer'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                기도문 생성
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="min-h-96">
          {currentPage === 'chat' && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">성경 기반 AI 상담</h2>
                <p className="text-gray-600">마음의 고민을 나누어보세요. 성경의 지혜로 함께하겠습니다.</p>
              </div>
              <ChatInterface />
            </div>
          )}
          
          {currentPage === 'prayer' && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">맞춤형 기도문 생성</h2>
                <p className="text-gray-600">상황에 맞는 기도문을 작성해드립니다.</p>
              </div>
              <PrayerGeneration />
            </div>
          )}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            "여호와는 나의 목자시니 내가 부족함이 없으리로다" - 시편 23:1
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;