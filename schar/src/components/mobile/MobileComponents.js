import { memo } from 'react'
import { STYLES, NAV_ITEMS, ANIMATION_CONFIG } from '@/constants'
import { GridButton } from '@/components/icons'

// 移动端左侧菜单按钮
export const MobileMenuButton = memo(({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`${STYLES.mobileButton} left-6 flex flex-col items-center justify-center`}
      aria-label="Toggle menu"
    >
      <div className='w-5 h-0.5 bg-black mb-1.5'></div>
      <div className='w-5 h-0.5 bg-black'></div>
    </button>
  )
})

// 移动端右侧四方格按钮
export const MobileGridButton = memo(({ onClick }) => {
  return (
    <GridButton
      onClick={onClick}
      className={`${STYLES.mobileButton} right-6`}
      ariaLabel="Navigation grid"
    />
  )
})

// 移动导航面板组件
export const MobileNavigationPanel = memo(({ show, onClose, onNavItemClick }) => {
  return (
    <div
      className={`absolute right-0 top-0 h-full w-3/4 sm:w-1/2
        ${STYLES.panel} transition-transform ${ANIMATION_CONFIG.panelTransition} z-30 ${
          show ? 'translate-x-0' : 'translate-x-full'
        }`}
    >
      <div className='sticky top-0 left-0 right-0 h-16 flex items-center px-4'>
        <button
          onClick={onClose}
          className='text-4xl leading-none text-[#0c75ff] transition-colors'
        >
          &times;
        </button>
      </div>
      <div className='overflow-y-auto no-scrollbar h-[calc(100%-4rem)] p-4'>
        <div className='grid grid-cols-2 gap-4'>
          {NAV_ITEMS.map((item) => (
            <div 
              key={item.id} 
              className='flex flex-col items-center cursor-pointer'
              onClick={() => onNavItemClick(item.id)}
            >
              <div className='w-full aspect-square mb-2 relative'>
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className='w-full h-full object-contain' 
                />
              </div>
              <span className='text-sm'>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}) 