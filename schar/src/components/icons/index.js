// 播放图标
export const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="#0c75ff" strokeWidth="2">
    <polygon points="5,3 19,12 5,21" />
  </svg>
)

// 暂停图标
export const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="#0c75ff" strokeWidth="2">
    <line x1="8" y1="4" x2="8" y2="20" />
    <line x1="16" y1="4" x2="16" y2="20" />
  </svg>
)

// 下载图标
export const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0c75ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15L12 3" />
    <path d="M7 10L12 15 17 10" />
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  </svg>
)

// 通用4方格按钮组件
export const GridButton = ({ onClick, className = "", ariaLabel = "Grid view" }) => (
  <button
    onClick={onClick}
    className={`w-5 h-5 grid grid-cols-2 grid-rows-2 gap-0.5 ${className}`}
    aria-label={ariaLabel}
  >
    <div className='w-2 h-2 bg-[#0c75ff]'></div>
    <div className='w-2 h-2 bg-[#0c75ff]'></div>
    <div className='w-2 h-2 bg-[#0c75ff]'></div>
    <div className='w-2 h-2 bg-[#0c75ff]'></div>
  </button>
)

// 左箭头图标
export const LeftArrowIcon = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 100 100">
    <polygon
      points="20,50 80,20 80,80"
      fill="#0c75ff"
      stroke="black"
      strokeWidth="3"
    />
  </svg>
)

// 右箭头图标
export const RightArrowIcon = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 100 100">
    <polygon
      points="80,50 20,20 20,80"
      fill="#0c75ff"
      stroke="black"
      strokeWidth="3"
    />
  </svg>
) 