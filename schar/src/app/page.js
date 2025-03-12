'use client'

import Header from '@/components/header'
import dynamic from 'next/dynamic'

const MySketch = dynamic(() => import('@/components/sketch'), {
  ssr: false
})

export default function Home () {
  return (
    <div className='flex flex-col h-screen overflow-hidden'>
      <Header />

      {/* 主内容容器 */}
      <div className='flex flex-1 overflow-hidden'>
        {/* 左栏滚动容器 */}
        <div className='w-1/3 overflow-y-scroll custom-scrollbar'>
          <article className='prose max-w-none flex-1 p-8'>
            <h2 className='custom-bg relative font-bold text-center inline-block rounded-full px-2'>
              <span className='relative z-10'>
                Early Chinese Characters in Sound Visualization
              </span>
            </h2>
            <p className='mt-4 text-sm text-justify leading-snug'>
              Based on the logic of early Chinese character creation, this study
              proposes a "shape, meaning, and sound" reconstruction method,
              aiming to explore new possibilities of symbol design through the
              comprehensive construction of shape (visual structure), meaning
              (symbolic semantics), and sound (sound). Therefore, during the
              symbol application practice stage, this study paid special
              attention to the dynamics, multi-sensory expression and
              cross-media adaptability of the symbol system, in order to
              construct an innovative design concept that is consistent with the
              traditional Chinese character creation logic and adaptable to
              modern symbol systems.
            </p>
            <h2 className='custom-bg relative font-bold text-center inline-block rounded-full px-2 mt-4'>
              <span className='relative z-10'>Operation and Gameplay</span>
            </h2>
            <p className='mt-4 text-sm text-justify '>
              <em className='text-[#adadad]'>
                This is a step-by-step operation guide and notes:
              </em>
            </p>
            <ul className='list-disc text-sm pl-6 space-y-2 max-w-2xl mx-auto'>
              <br />
              <li>
                Step 1: Click the Start button and tell the computer any sound
                you want to make
              </li>
              <li>
                Step 2: Select the Bezier curve adjustment axis to adjust the
                symbol to be straight or round
              </li>
              <li>
                Step 3: You can select the switch button to switch between
                different symbols for interaction
              </li>
              <li>
                Note: You can choose to press the Pause button to stop the
                interaction
              </li>
            </ul>
            <h2 className='custom-bg relative font-bold text-center inline-block rounded-full px-2 mt-4'>
              <span className='relative z-10'>Innovation</span>
            </h2>
            <p className='mt-4 text-sm text-justify leading-snug'>
              <em className='text-[#adadad] '>
                This study proposes an innovative "shape, meaning and sound"
                reconstruction method based on the combination of traditional
                Chinese character creation logic and modern graphic symbol
                design, realizing the digital, systematized and visualized
                expression of Chinese character cultural elements. Explore the
                mapping relationship between sound and graphic symbols, and
                propose a symbol visualization method based on phonological
                features.
              </em>
            </p>
            <ul className='list-disc text-sm pl-6 space-y-2 max-w-2xl mx-auto'>
              <br />
              <li>
                A method of "shape, meaning and sound" reconstruction is
                proposed to achieve multimodal fusion of Chinese characters.
              </li>
              <li>
                Construct a "shape, meaning and sound" digital symbol library
                and explore real-time symbol generation based on
                parameterization.
              </li>
              <li>
                Explore the mapping relationship between sound and graphic
                symbols, and propose a symbol visualization method based on
                phonological features.
              </li>
            </ul>
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
