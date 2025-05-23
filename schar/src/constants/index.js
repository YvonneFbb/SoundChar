// 调试模式开关
export const ENABLE_DEBUG = false

// 画布配置
export const CANVAS_CONFIG = {
  defaultSize: [800, 800],
  gridSize: 30
}

// 音频配置
export const AUDIO_CONFIG = {
  sampleInterval: 5,
  fftSmoothness: 0.8,
  fftBins: 64,
  micAmp: 0.8
}

// 移动设备断点
export const BREAKPOINTS = {
  mobile: 768
}

// 动画配置
export const ANIMATION_CONFIG = {
  panelTransition: 'duration-300 ease-in-out',
  colorTransition: 'transition-opacity'
}

// 样式类名
export const STYLES = {
  button: 'p-3 text-[#f6c7ac] rounded-full flex items-center justify-center w-12 h-12',
  panel: 'bg-gray-200/30 backdrop-blur',
  mobileButton: 'absolute top-6 z-10',
  centerText: 'absolute left-1/2 -translate-x-1/2',
  songFont: 'song-font'
}

// 导航数据 - 与charData数组顺序匹配
export const NAV_ITEMS = [
  { id: 0, name: '气', image: '/phonenav/导视_气  副本.png' },
  { id: 1, name: '月', image: '/phonenav/导视_月 副本.png' },
  { id: 2, name: '金', image: '/phonenav/导视_金 副本.png' },
  { id: 3, name: '木', image: '/phonenav/导视_木 副本.png' },
  { id: 4, name: '水', image: '/phonenav/导视_水 副本.png' },
  { id: 5, name: '火', image: '/phonenav/导视_火 副本.png' },
  { id: 6, name: '土', image: '/phonenav/导视_土 副本.png' },
  { id: 7, name: '工', image: '/phonenav/导视_工 副本.png' },
  { id: 8, name: '日', image: '/phonenav/导视_日 副本.png' },
  { id: 9, name: '爿', image: '/phonenav/导视_爿 副本.png' },
  { id: 10, name: '言', image: '/phonenav/导视_言 副本.png' },
  { id: 11, name: '艹', image: '/phonenav/导视_艹 副本.png' },
  { id: 12, name: '石', image: '/phonenav/导视_石 副本.png' },
  { id: 13, name: '目', image: '/phonenav/导视_目 副本.png' },
  { id: 14, name: '衣', image: '/phonenav/导视_衣 副本.png' },
  { id: 15, name: '口', image: '/phonenav/导视_口 副本.png' },
  { id: 16, name: '虫', image: '/phonenav/导视_虫 副本.png' },
  { id: 17, name: '阝', image: '/phonenav/导视_阝 副本.png' },
  { id: 18, name: '心', image: '/phonenav/导视_心 副本.png' },
  { id: 19, name: '勹', image: '/phonenav/导视_勹 副本.png' },
  { id: 20, name: '人', image: '/phonenav/导视_人 副本.png' },
  { id: 21, name: '雨', image: '/phonenav/导视_雨 副本.png' },
  { id: 22, name: '斤', image: '/phonenav/导视_斤 副本.png' },
  { id: 23, name: '足', image: '/phonenav/导视_足 副本.png' },
  { id: 24, name: '辶', image: '/phonenav/导视_辶 副本.png' },
  { id: 25, name: '宀', image: '/phonenav/导视_宀 副本.png' },
  { id: 26, name: '央', image: '/phonenav/导视_央 副本.png' },
  { id: 27, name: '未', image: '/phonenav/导视_未 副本.png' }
] 