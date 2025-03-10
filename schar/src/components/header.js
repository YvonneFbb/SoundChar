'use client'

import Image from 'next/image'

export default function Header () {
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

        {/* 右侧链接 */}
        <div className='flex px-4 justify-end'>
          <a
            href='#contact'
            className='text-black-600 transition-colors'
          >
            Reference
          </a>
        </div>
      </nav>
    </header>
  )
}
