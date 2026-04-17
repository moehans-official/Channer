import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useStatsStore } from '../stores/statsStore';
import { FileText, AlertCircle } from 'lucide-react';

export function LogsPage() {
  const { logs, fetchLogs, loading } = useStatsStore();
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchLogs({ limit, offset: (page - 1) * limit });
  }, [page]);

  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{statusCode}</span>;
    } else if (statusCode >= 400) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">{statusCode}</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">{statusCode}</span>;
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">日志查询</h1>
        <p className="text-gray-500 mt-2">查看API请求日志和使用记录</p>
      </div>

      {loading ? (
        <div className="text-center py-12">加载中...</div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>Key ID</th>
                  <th>请求类型</th>
                  <th>Token数</th>
                  <th>费用</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center">
                        <FileText className="w-12 h-12 mb-2 text-gray-300" />
                        暂无日志记录
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-sm">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td>{log.api_key_id}</td>
                      <td>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {log.request_type}
                        </span>
                      </td>
                      <td className="text-sm">
                        <div>输入: {log.input_tokens.toLocaleString()}</div>
                        <div>输出: {log.output_tokens.toLocaleString()}</div>
                      </td>
                      <td>${log.cost.toFixed(4)}</td>
                      <td>{getStatusBadge(log.status_code)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {logs.length > 0 && (
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                上一页
              </button>
              <span className="text-gray-600">第 {page} 页</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={logs.length < limit}
                className="btn-secondary disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
