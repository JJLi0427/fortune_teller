import { useState } from 'react';
import { Heart, Briefcase, TrendingUp, Star, Calendar, User, BookOpen, MapPin, MessageCircle, Baby, Compass, Wind, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';

const Index = () => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 模拟命理数据
  const fortuneData = {
    career: { score: 85, advice: '适合拓展新业务领域，会有贵人相助' },
    love: { score: 72, advice: '感情稳定，适合深入交流增进了解' },
    business: { score: 90, advice: '投资运势佳，可考虑长期项目' }
  };

  // 核心功能列表
  const coreFeatures = [
    {
      title: "智能起名",
      description: "结合八字五行，提供寓意深远的名字推荐",
      icon: Baby,
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "风水知识",
      description: "专业风水布局指导，改善居住和工作环境",
      icon: Compass,
      color: "bg-green-100 text-green-600"
    },
    {
      title: "八字测算",
      description: "精准八字分析，揭示命运轨迹与人生方向",
      icon: Wind,
      color: "bg-purple-100 text-purple-600"
    }
  ];

  // 创新功能列表
  const innovativeFeatures = [
    {
      title: "可视化祈福地点推荐",
      description: "基于地理位置推荐附近适合的道观、寺庙等祈福场所",
      icon: MapPin,
      color: "bg-amber-100 text-amber-600"
    },
    {
      title: "AI赛博导师陪伴",
      description: "学习用户历史数据，模拟命理师对话场景提供个性化指导",
      icon: MessageCircle,
      color: "bg-pink-100 text-pink-600"
    }
  ];

  // Helper to extract content from SSE event string using regex
  const extractContentFromSSE = (raw) => {
    try {
      // 查找所有的 event:reply 事件
      const replyEvents = raw.match(/event:reply data:\{[^}]*"type":"reply"[^}]*\}/g);
      
      if (replyEvents && replyEvents.length > 0) {
        // 取最后一个 reply 事件
        const lastReplyEvent = replyEvents[replyEvents.length - 1];
        
        // 提取完整的 JSON 数据部分
        const jsonMatch = lastReplyEvent.match(/data:(\{.*\})$/);
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[1]);
          if (jsonData.payload && jsonData.payload.content) {
            return jsonData.payload.content;
          }
        }
      }
      
      // 如果上述方法失败，尝试简单的正则匹配
      const simpleRegex = /"content":"([^"]*?)"/g;
      const matches = [...raw.matchAll(simpleRegex)];
      if (matches.length > 0) {
        // 返回最后一个匹配的内容
        return matches[matches.length - 1][1];
      }
      
      return '抱歉，解析响应时出现问题，请重试。';
    } catch (error) {
      console.error('解析SSE响应失败:', error);
      return '抱歉，解析响应时出现问题，请重试。';
    }
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    // 添加用户消息
    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      // 生成唯一的session_id和visitor_biz_id
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const visitorBizId = `visitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 构建对话内容 - 包含系统角色设定和用户消息
      const systemPrompt = "你是一位专业的命理师，结合传统命理学和现代心理学知识，为用户提供人生指导和建议。回答要专业、有深度，同时通俗易懂。";
      const conversationHistory = messages.map(msg => `${msg.role === 'user' ? '用户' : '命理师'}: ${msg.content}`).join('\n');
      const fullContent = `${systemPrompt}\n\n${conversationHistory}\n用户: ${query}`;

      // 调用腾讯云智能体开发平台API
      const response = await axios.post('https://wss.lke.cloud.tencent.com/v1/qbot/chat/sse', {
        session_id: sessionId,
        bot_app_key: "UwsMfxVGTFbXtjHXWcWLjaBaBHgAoAmhRPByVzHDImSqwudQGUigXUGXOhPKrmTiIbVwAsUvHWzgaCWjqPrEgQbltmPTywrQaaoLuwxChKHlUizTdUoFtFwsOsaBpSaF",
        visitor_biz_id: visitorBizId,
        content: fullContent,
        stream: "disable", // 使用非流式传输，简化处理
        system_role: systemPrompt,
        model_name: "hunyuan" // 使用混元大模型
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // 处理腾讯云API响应
      let aiContent = '';
      
      // 首先检查是否是标准的JSON响应格式
      if (response.data && typeof response.data === 'object') {
        if (response.data.payload && response.data.payload.content) {
          aiContent = response.data.payload.content;
        } else if (response.data.content) {
          aiContent = response.data.content;
        }
      } 
      // 如果是字符串格式（可能是SSE格式），尝试解析
      else if (typeof response.data === 'string') {
        aiContent = extractContentFromSSE(response.data);
      }
      
      // 如果仍然没有获取到内容，使用默认错误消息
      if (!aiContent || aiContent.trim() === '') {
        aiContent = '抱歉，我现在无法为您提供咨询服务。请稍后再试。';
      }

      // 添加AI回复
      const aiMessage = {
        role: 'assistant',
        content: aiContent
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('API调用失败:', error);
      const errorMessage = {
        role: 'assistant',
        content: '抱歉，我现在无法为您提供咨询服务。请稍后再试。'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-100">
      {/* 头部区域 */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-indigo-900">风后奇门</h1>
              <p className="text-gray-600">传统命理与大数据算法结合的智能决策平台</p>
            </div>
          </div>
        </div>
      </header>

      {/* 大模型对话区域 */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                玄机AI命理师
              </CardTitle>
              <CardDescription>与AI命理师对话，获取专业人生指导</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      欢迎咨询玄机AI命理师！请输入您的问题，如"我的事业运如何？"
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message, index) => (
                        <div 
                          key={index} 
                          className={`p-3 rounded-lg max-w-[80%] ${
                            message.role === 'user' 
                              ? 'bg-indigo-100 ml-auto' 
                              : 'bg-white border border-gray-200'
                          }`}
                        >
                          <div className="font-medium text-sm mb-1">
                            {message.role === 'user' ? '您' : '玄机AI命理师'}
                          </div>
                          <div className="text-gray-700">{message.content}</div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="p-3 rounded-lg bg-white border border-gray-200">
                          <div className="font-medium text-sm mb-1">玄机AI命理师</div>
                          <div className="text-gray-700">正在思考中...</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <form onSubmit={handleQuerySubmit} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="请输入您的问题，如'我的事业运如何？'..."
                    className="flex-grow"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* 核心功能介绍 */}
        <section className="mb-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">核心功能</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              传承千年智慧，结合现代科技，为您提供全方位的命理服务
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coreFeatures.map((feature, index) => (
              <Card key={index} className="border-indigo-100 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`${feature.color} p-3 rounded-full`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span>准确率: {90 + index * 2}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 创新功能介绍 */}
        <section className="mb-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">创新功能</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              融合前沿科技，打造全新的命理体验
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {innovativeFeatures.map((feature, index) => (
              <Card key={index} className="border-indigo-100 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`${feature.color} p-3 rounded-full`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 个人运势概览 */}
        <section className="mb-12">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                个人运势概览
              </CardTitle>
              <CardDescription>基于您的生辰信息分析的今日运势</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">综合运势</TabsTrigger>
                  <TabsTrigger value="career">事业</TabsTrigger>
                  <TabsTrigger value="love">情感</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-indigo-50 rounded-lg">
                      <div className="text-4xl font-bold text-indigo-700 mb-2">{fortuneData.career.score}</div>
                      <div className="text-indigo-600 font-medium">事业运势</div>
                      <p className="text-sm text-gray-600 mt-2">{fortuneData.career.advice}</p>
                    </div>
                    <div className="text-center p-6 bg-pink-50 rounded-lg">
                      <div className="text-4xl font-bold text-pink-700 mb-2">{fortuneData.love.score}</div>
                      <div className="text-pink-600 font-medium">情感运势</div>
                      <p className="text-sm text-gray-600 mt-2">{fortuneData.love.advice}</p>
                    </div>
                    <div className="text-center p-6 bg-emerald-50 rounded-lg">
                      <div className="text-4xl font-bold text-emerald-700 mb-2">{fortuneData.business.score}</div>
                      <div className="text-emerald-600 font-medium">商业运势</div>
                      <p className="text-sm text-gray-600 mt-2">{fortuneData.business.advice}</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="career" className="mt-6">
                  <div className="p-6 bg-indigo-50 rounded-lg">
                    <h3 className="text-xl font-semibold text-indigo-800 mb-4">事业运势详情</h3>
                    <p className="text-gray-700 mb-4">
                      今日事业运势极佳，适合主动出击争取机会。您的专业能力将得到认可，有升职加薪的可能。
                      建议多与同事沟通合作，团队项目将取得突破性进展。
                    </p>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>吉时: 10:00-12:00</span>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="love" className="mt-6">
                  <div className="p-6 bg-pink-50 rounded-lg">
                    <h3 className="text-xl font-semibold text-pink-800 mb-4">情感运势详情</h3>
                    <p className="text-gray-700 mb-4">
                      情感运势平稳，适合与伴侣深入交流。单身者有机会遇到心仪的对象，但需主动表达心意。
                      建议多关注对方的情感需求，小小的关怀会带来意想不到的效果。
                    </p>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>桃花位: 西南方</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* 技术原理介绍 */}
        <section>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                技术原理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">传统命理学</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <div className="bg-indigo-100 rounded-full p-1 mr-2 mt-1">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                      </div>
                      <span>基于八字、紫微斗数等传统理论体系</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-indigo-100 rounded-full p-1 mr-2 mt-1">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                      </div>
                      <span>结合五行生克关系分析个人特质</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-indigo-100 rounded-full p-1 mr-2 mt-1">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                      </div>
                      <span>参考流年大运预测未来趋势</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">大数据算法</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <div className="bg-emerald-100 rounded-full p-1 mr-2 mt-1">
                        <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                      </div>
                      <span>整合海量用户行为数据进行分析</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-emerald-100 rounded-full p-1 mr-2 mt-1">
                        <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                      </div>
                      <span>运用机器学习模型优化预测准确性</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-emerald-100 rounded-full p-1 mr-2 mt-1">
                        <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                      </div>
                      <span>实时更新数据模型以适应时代变化</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>© 2023 玄机决策. 结合传统智慧与现代科技，为您提供人生指引。</p>
            <p className="mt-2 text-sm">本平台仅供娱乐参考，重要决策请结合实际情况</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
