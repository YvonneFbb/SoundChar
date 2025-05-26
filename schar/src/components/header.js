'use client'

import Image from 'next/image'
import { GridButton } from '@/components/icons'

export default function Header ({ onReferenceClick, onNavigationClick, language, onLanguageToggle }) {
  return (
    <header
      className='border-b border-black sticky top-0 bg-white z-10'
      style={{ height: '3rem' }}
    >
      <nav className='mx-auto h-full flex items-center justify-between'>
        {/* 左侧文字 */}
        <div className='h-full py-2 px-4 justify-start'>
          <img
            src='/logo.png'
            alt='中国美术学院'
            className='h-full w-auto object-contain'
          />
        </div>

        {/* 中间空白区域 */}
        <div className='flex-auto' />

        {/* 右侧按钮 */}
        <div className='flex items-center gap-4 px-4'>
          <button className='flex px-2 justify-end' onClick={onReferenceClick}>
            <span className='text-[#0c75ff] transition-colors underline'>
            Reference
          </span>
        </button>
          <button className='flex px-2 justify-end' onClick={onLanguageToggle}>
            <span className='text-[#0c75ff] transition-colors underline'>
              {language === 'en' ? 'CN' : 'EN'}
            </span>
          </button>
          <GridButton 
            onClick={onNavigationClick}
            ariaLabel="Characters navigation"
          />
        </div>
      </nav>
    </header>
  )
}
