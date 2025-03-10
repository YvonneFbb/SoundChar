'use client'

import Image from 'next/image'

export default function Header () {
  return (
    <header
      className='border-b border-black sticky top-0 bg-white z-10'
      style={{ height: '3rem' }}
    >
      <nav className='container mx-auto h-full px-4 flex items-center justify-between'>
        {/* 左侧文字 */}
        <div className='flex-1 h-full py-2'>
        <img 
            src="../public/logo.png" 
            alt="中国美术学院" 
            className='h-full w-auto object-contain' // 关键修改
          />
        </div>

        {/* 中间空白区域 */}
        <div className='flex-auto' />

        {/* 右侧链接 */}
        <div className='flex-1 flex justify-end'>
          <a
            href='#contact'
            className='text-blue-600 hover:text-blue-800 transition-colors'
          >
            Reference
          </a>
        </div>
      </nav>
    </header>
  )
}
