'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import Header from '@/components/header'
import dynamic from 'next/dynamic'
import { ReferencePanel, IntroContent, DesktopNavigationPanel } from '@/components/panels'
import { MobileMenuButton, MobileGridButton, MobileNavigationPanel } from '@/components/mobile/MobileComponents'
import { useMobile } from '@/hooks/useMobile'
import { STYLES, ANIMATION_CONFIG } from '@/constants'

const MySketch = dynamic(() => import('@/components/sketch'), {
  ssr: false
})

export default function Home() {
  const [showReference, setShowReference] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [contentCloned, setContentCloned] = useState(false)
  const [showNavigation, setShowNavigation] = useState(false)
  const [showDesktopNavigation, setShowDesktopNavigation] = useState(false)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [language, setLanguage] = useState('en')
  
  const isMobile = useMobile()

  // 事件处理函数
  const toggleReference = useCallback(() => {
    setShowReference(prev => !prev)
  }, [])

  const toggleIntro = useCallback(() => {
    setShowIntro(prev => !prev)
  }, [])

  const toggleNavigation = useCallback(() => {
    setShowNavigation(prev => !prev)
  }, [])

  const toggleDesktopNavigation = useCallback(() => {
    setShowDesktopNavigation(prev => !prev)
  }, [])

  const handleNavItemClick = useCallback((id) => {
    setCurrentCharIndex(id)
    setShowNavigation(false)
    setShowDesktopNavigation(false)
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'en' ? 'cn' : 'en')
  }, [])

  // 移动设备检测和内容克隆
  useEffect(() => {
    const updateIntroState = () => {
      if (isMobile !== undefined) {
        setShowIntro(!isMobile)
        if (!isMobile) {
          setShowNavigation(false)
        }
      }
    }

    updateIntroState()
  }, [isMobile])

  useEffect(() => {
    const cloneContentIfNeeded = () => {
      if (isMobile) {
        const sourceContent = document.getElementById('introContent')
        const targetContent = document.getElementById('mobileIntroContent')

        if (sourceContent && targetContent) {
          // 清空目标内容
          targetContent.innerHTML = ''
          
          // 克隆新内容
          const fragment = document.createDocumentFragment()
          Array.from(sourceContent.childNodes).forEach(node => {
            fragment.appendChild(node.cloneNode(true))
          })
          targetContent.appendChild(fragment)
          setContentCloned(true)
        }
      }
    }

    if (isMobile) {
      const timer = setTimeout(cloneContentIfNeeded, 100)
      return () => clearTimeout(timer)
    }
  }, [isMobile, contentCloned, language])

  // 移动端介绍面板
  const mobileIntroPanel = useMemo(() => {
    if (!isMobile) return null

    return (
      <div
        className={`absolute left-0 bottom-0 h-full w-3/4 sm:w-1/2
          ${STYLES.panel} transition-transform ${ANIMATION_CONFIG.panelTransition} z-30 ${
            showIntro ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className='sticky top-0 left-0 right-0 h-16 flex items-center justify-between px-4'>
          <h2 className='text-lg font-black text-[#0c75ff]'>Introduction</h2>
          <div className='flex items-center gap-3'>
            <button
              onClick={toggleLanguage}
              className='text-sm font-medium text-[#0c75ff] underline'
            >
              {language === 'en' ? 'CN' : 'EN'}
            </button>
            <button
              onClick={toggleIntro}
              className='text-4xl leading-none text-[#0c75ff] transition-colors'
            >
              &times;
            </button>
          </div>
        </div>
        <div className='overflow-y-auto no-scrollbar h-[calc(100%-4rem)]'>
          <div id="mobileIntroContent" className='px-4 mobile-content'>
            {/* 动态填充内容 */}
          </div>
          <style jsx>{`
            .mobile-content :global(h2) {
              font-size: 0.9rem !important;
            }
            .mobile-content :global(p),
            .mobile-content :global(li),
            .mobile-content :global(em) {
              font-size: 0.75rem !important;
              line-height: 1.3 !important;
            }
            .mobile-content :global(ul) {
              margin-top: 0.5rem !important;
              margin-bottom: 0.5rem !important;
            }
            .mobile-content :global(h2) {
              margin-top: 0.75rem !important;
              margin-bottom: 0.5rem !important;
            }
          `}</style>
        </div>
      </div>
    )
  }, [isMobile, showIntro, toggleIntro, language, toggleLanguage])

  // 主内容区域
  const mainContent = useMemo(() => {
    return (
      <div className='flex flex-col md:flex-row flex-1 overflow-hidden'>
        {/* PC端介绍内容容器 */}
        <div className={`w-full md:w-1/3 overflow-y-scroll custom-scrollbar ${isMobile ? 'hidden' : 'block'}`}>
          <IntroContent language={language} />
        </div>

        {/* 画布容器 */}
        <div className='w-full md:w-2/3 h-full min-h-[60vh] md:min-h-0 overflow-hidden'>
          <MySketch currentCharIndex={currentCharIndex} />
        </div>

        {/* 引用面板 */}
        <ReferencePanel showReference={showReference} onClose={toggleReference} />

        {/* PC端字符导航面板 */}
        <DesktopNavigationPanel 
          showNavigation={showDesktopNavigation} 
          onClose={toggleDesktopNavigation}
          onNavItemClick={handleNavItemClick}
        />

        {/* 移动端面板 */}
        {mobileIntroPanel}
        
        {isMobile && (
          <MobileNavigationPanel 
            show={showNavigation} 
            onClose={toggleNavigation}
            onNavItemClick={handleNavItemClick}
          />
        )}
      </div>
    )
  }, [isMobile, showReference, toggleReference, showDesktopNavigation, toggleDesktopNavigation, mobileIntroPanel, showNavigation, toggleNavigation, handleNavItemClick, currentCharIndex, language])

  return (
    <div className='flex flex-col h-screen overflow-hidden'>
      {/* Header - 仅在桌面端显示 */}
      {!isMobile && (
        <Header 
          onReferenceClick={toggleReference} 
          onNavigationClick={toggleDesktopNavigation}
          language={language}
          onLanguageToggle={toggleLanguage}
        />
      )}

      {/* 移动端按钮 */}
      {isMobile && (
        <>
          <MobileMenuButton onClick={toggleIntro} />
          <MobileGridButton onClick={toggleNavigation} />
        </>
      )}

      {/* 主内容区域 */}
      {mainContent}
    </div>
  )
}
