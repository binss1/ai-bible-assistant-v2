import React, { useState, useEffect } from 'react';
import { Clock, MessageCircle, Trash2, Search } from 'lucide-react';

const ConversationHistory = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      // TODO: API 호출로 대화 기록 로드
      // const response = await fetch('/api/conversations');
      // const data = await response.json();
      
      // 샘플 데이터
      const sampleConversations = [
        {
          id: '1',
          title: '사랑에 대한 고민',
          lastMessage: '하나님의 사랑에 대해 궁금합니다.',
          timestamp: new Date(Date.now() - 86400000), // 1일 전
          messageCount: 12
        },
        {
          id: '2',
          title: '진로 선택 고민',
          lastMessage: '어떤 길을 선택해야 할지 모르겠어요.',
          timestamp: new Date(Date.now() - 172800000), // 2일 전
          messageCount: 8
        },
        {
          id: '3',
          title: '가족 관계 문제',
          lastMessage: '부모님과의 관계가 어려워요.',
          timestamp: new Date(Date.now() - 259200000), // 3일 전
          messageCount: 15
        }
      ];
      
      setConversations(sampleConversations);
    } catch (error) {
      console.error('대화 기록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId) => {
    if (window.confirm('이 대화를 삭제하시겠습니까?')) {
      try {
        // TODO: API 호출로 대화 삭제
        // await fetch(`/api/conversations/${conversationId}`, { method: 'DELETE' });
        
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      } catch (error) {
        console.error('대화 삭제 실패:', error);
      }
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date) => {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2">대화 기록을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">대화 기록</h2>
      
      {/* 검색 바 */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="대화 기록 검색..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* 대화 목록 */}
      <div className="space-y-4">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? '검색 결과가 없습니다.' : '대화 기록이 없습니다.'}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedConversation(conversation)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">
                    {conversation.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {conversation.lastMessage}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 space-x-4">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(conversation.timestamp)}
                    </span>
                    <span className="flex items-center">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      {conversation.messageCount}개 메시지
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conversation.id);
                  }}
                  className="ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 대화 상세 모달 (선택사항) */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{selectedConversation.title}</h3>
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                {formatDate(selectedConversation.timestamp)} • {selectedConversation.messageCount}개 메시지
              </p>
              <div className="text-sm text-gray-500">
                대화 내용을 보려면 새 상담을 시작하여 이전 대화를 참조하세요.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationHistory;