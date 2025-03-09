'use client'
import Image from 'next/image'
import MySketch from '@/components/sketch.tsx'
import Header from '@/components/header.tsx'

export default function Home () {
  return (
    <div className='flex flex-col h-screen overflow-hidden'>
      <Header />

      {/* 主内容容器 */}
      <div className='flex flex-1 overflow-hidden'>
        {/* 左栏滚动容器 */}
        <div className='w-1/3 overflow-y-scroll custom-scrollbar'>
          <article className='prose max-w-none flex-1 p-8'>
            <h2>第一章</h2>
            {[...Array(50)].map((_, i) => (
              <p key={i} className='mb-4'>
                Here is the detailed text content paragraph {i + 1}, used to
                test the scroll bar display effect...
              </p>
            ))}
          </article>
        </div>

        {/* 右栏画布容器 */}
        <div className='w-2/3 h-full overflow-hidden'>
          <MySketch />
        </div>
      </div>
    </div>
  )
}
