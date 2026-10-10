import React from 'react';
import { Download, Trash2, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { saveAs } from 'file-saver';
import type { CreationRecord } from '../types';
import { formatBytes, formatDimensions } from '../utils/formatters';

interface MyCreationsProps {
  creations: CreationRecord[];
  onRemoveCreation: (id: string) => void;
  onClearAll: () => void;
  onBackToProcess: () => void;
}

export const MyCreationsModal: React.FC<MyCreationsProps> = ({
  creations,
  onRemoveCreation,
  onClearAll,
  onBackToProcess,
}) => {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToProcess}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            title="返回图片处理"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 m-0">我的作品</h2>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              记录您在本次会话中处理并导出的图片（纯浏览器端暂存）
            </p>
          </div>
        </div>

        {creations.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清空记录</span>
          </button>
        )}
      </div>

      {/* Creations Grid */}
      {creations.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 m-0">暂无导出的作品</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            您在编辑器中点击“下载”导出的图片将会自动归档展示在此处。
          </p>
          <button
            onClick={onBackToProcess}
            className="mt-5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
          >
            立即处理图片
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {creations.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="relative aspect-video bg-slate-100 overflow-hidden flex items-center justify-center">
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-3.5 flex flex-col gap-2 flex-1 justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 truncate m-0">
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                    <span>{formatDimensions(item.width, item.height)}</span>
                    <span>{formatBytes(item.size)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => saveAs(item.blob, item.name)}
                      className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white transition-colors"
                      title="再次下载"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemoveCreation(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="移除记录"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
