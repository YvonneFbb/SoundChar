'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/header'
import dynamic from 'next/dynamic'

const MySketch = dynamic(() => import('@/components/sketch'), {
  ssr: false
})

export default function Home () {
  const [showReference, setShowReference] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // 检测是否为移动设备并处理内容克隆
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 768
      setIsMobile(isMobileView)
      // 在移动设备上默认隐藏介绍内容
      if (isMobileView) {
        setShowIntro(false)
      } else {
        setShowIntro(true)
      }
    }

    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)

    // 克隆内容到移动端面板
    const cloneContent = () => {
      const sourceContent = document.getElementById('introContent')
      const targetContent = document.getElementById('mobileIntroContent')

      if (sourceContent && targetContent) {
        // 克隆内容但保留原始ID
        const clonedContent = sourceContent.cloneNode(true)

        // 清空目标容器
        while (targetContent.firstChild) {
          targetContent.removeChild(targetContent.firstChild)
        }

        // 将克隆的子元素添加到目标容器
        while (clonedContent.firstChild) {
          targetContent.appendChild(clonedContent.firstChild)
        }
      }
    }

    // 在组件挂载和更新时克隆内容
    const timer = setTimeout(cloneContent, 100)

    return () => {
      window.removeEventListener('resize', checkIfMobile)
      clearTimeout(timer)
    }
  }, [])

  const toggleReference = () => {
    setShowReference(!showReference)
  }

  const toggleIntro = () => {
    setShowIntro(!showIntro)
  }

  return (
    <div className='flex flex-col h-screen overflow-hidden'>
      {/* 在手机端隐藏整个 header */}
      {!isMobile && <Header onReferenceClick={toggleReference} />}

      {/* 移动端介绍内容切换按钮 - 极简样式 */}
      {isMobile && (
        <button
          onClick={toggleIntro}
          className='absolute top-6 left-6 z-10 flex flex-col items-center justify-center'
        >
          <div className='w-5 h-0.5 bg-black mb-1.5'></div>
          <div className='w-5 h-0.5 bg-black'></div>
        </button>
      )}

      {/* 主内容容器 - 在手机端改为纵向排列 */}
      <div className='flex flex-col md:flex-row flex-1 overflow-hidden'>
        {/* 引用面板 - 添加毛玻璃效果 (在手机端隐藏) */}
        <div
          className={`absolute left-0 bottom-0 h-[calc(100%-3rem)] w-[calc(33.3%-8px)]
            bg-gray-200/30 backdrop-blur transition-transform
            duration-300 ease-in-out z-20 hidden md:block ${
              showReference ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          {/* 标题和关闭按钮容器 */}
          <div className='sticky top-0 left-0 right-0 h-16 flex items-center justify-between px-6'>
            {/* 标题 - 调整text-[颜色]和text-[尺寸] */}
            <h2 className='text-2xl font-black text-[#0c75ff]'>Reference</h2>
            {/* 关闭按钮 - 调整text-[颜色]和text-[尺寸] */}
            <button
              onClick={toggleReference}
              className='text-5xl leading-none text-[#0c75ff] transition-colors'
            >
              &times;
            </button>
          </div>
          <div className='overflow-y-auto no-scrollbar h-[calc(100%-4rem)]'>
            <article className='prose max-w-none flex-1 px-8'>
              <ul className='space-y-0 font-black text-sm text-[#0c75ff]'>
                <li>[1] 黄亚平, 孟华生. 汉字符号学[M].上海古籍出版社,2001.</li>
                <li>[2] 姜亮夫, 姜昆武. 古文字学[M]. 云南人民出版社1999.</li>
                <li>
                  [3] 刘凤君.
                  中国早期文字骨刻文的发现与研究[J].档案,2017,(03):5-13.
                </li>
                <li>
                  [4] International Organization for Standardization. Graphical
                  symbols — Vocabulary[OL].(2003)[2025-01-16].
                </li>
                <li>[5] 唐兰.古文字学导论[M].齐魯书社,1981.</li>
                <li>[6] 唐兰.中国文字学[M].上海古籍出版社,2005.</li>
                <li>[7] 牛清波.中国早期刻画符号整理与研究[D].安徽大学,2013.</li>
                <li>
                  [8]
                  陈楠.再造·甲骨——现代设计语境中的甲骨文创新设计[J].装饰,2018,(05):104-107.
                </li>
                <li>
                  [9]
                  莫伯峰,张重生.以多模态大模型推动中国古文字研究发展[J].中国语言战略,2024,11(02):37-47.
                </li>
                <li>
                  [10]
                  徐加跃,李春桃.大语言模型时代古文字研究的机遇与挑战[J].中国语言战略,2024,11(02):48-58.
                </li>
                <li>
                  [11] Meng, Lin. "Recognition of Oracle Bone Inscriptions by
                  Extracting Line Features on Image Processing." ICPRAM. 2017.
                </li>
                <li>
                  [12] Gao, Junheng, and Xun Liang. "Distinguishing oracle
                  variants based on the isomorphism and symmetry invariances of
                  oracle-bone inscriptions." IEEE Access 8 (2020):
                  152258-152275.
                </li>
                <li>[13] 刘钊.古文字构型学[M].福建人民出版社,2006.</li>
                <li>[14] 王筠. 说文释例[M].中华书局,1987.</li>
                <li>[15] 孙怡让. 古籀拾遗[M].中华书局,1989.</li>
                <li>
                  [16] 姚孝遂. 古文字的符号化问题[J]. 香港中文大学:
                  古文字学论集, 1983, 116.
                </li>
                <li>
                  [17] 冯振安.中国古文字造型与现代设计研究[D].江南大学,2005.
                </li>
                <li>
                  [18]
                  刑立志.拟真与超越：甲骨文造型艺术语言与视觉图式探析[J].今古文创,2021,(30):95-96.
                </li>
                <li>
                  [19]
                  薛伟明.符号学视角下甲骨文造型的意象特征与审美意义[J].南京师范大学文学院学报,2021,(02):88-93.
                </li>
                <li>[20] 王璇.《说文解字》的设计解读[D].南京艺术学院,2017.</li>
                <li>
                  [21]
                  李月怡.基于东巴文图形特征的汉字字体设计应用研究[D].云南师范大学,2019.
                </li>
                <li>
                  [22]
                  唐绍钧.东巴文字解构设计研究及其在现代平面设计中的应用[D].昆明理工大学,2009.
                </li>
                <li>
                  [23]
                  胡江升,赵晓芳.甲骨文在现代设计中的应用研究[J].天工,2022,(21):48-50.
                </li>
                <li>
                  [24]
                  姜在新,曹祎蕾.甲骨文意象美在现代设计中的应用[J].炎黄地理,2022,(05):31-33.
                </li>
                <li>
                  [25]
                  陈楠.格律的设计——甲骨文、东巴文的概念设计与应用[C]//汕头大学长江艺术与设计学院,清华大学美术学院.“岁寒三友——诗意的设计”——两岸三地中国传统图形与现代视觉设计学术研讨会论文集.清华大学美术学院装潢艺术设计系,2004:14.
                </li>
                <li>
                  [26] 汉字“合文”现象在近现代标志设计中应用的研究[D].西南大学,
                  2021.
                </li>
                <li>[27] 李金蔓. 寻古鉴今[D].南京艺术学院, 2021.</li>
                <li>
                  [28] 梁桓彬. 汉字构形与表意视觉设计研究[D].中国美术学院, 2023.
                </li>
                <li>
                  [29]
                  骆冬青.象形、象意与表意——论汉字审美符号的存在方式[J].南京师大学报(社会科学版),2014,(05):141-147.
                </li>
                <li>[30] 曹雪.会意字构形演变研究[D].西北大学,2017.</li>
                <li>[31] 陈炜湛. 甲骨文简论[M]. 上海古籍出版社, 1987.</li>
                <li>[32] 马晓风.甲骨文会意字研究[D].陕西师范大学,2005.</li>
                <li>
                  [33] Peirce C S. Collected papers of charles sanders
                  peirce[M]. Harvard University Press, 1934.
                </li>
                <li>
                  [34] Neurath M. Isotype[J]. Instructional science, 1974:
                  127-150.
                </li>
                <li>
                  [35] Aicher O. World as Design: Writings of Design[M]. John
                  Wiley & Sons, 1994.
                </li>
                <li>
                  [36] JOHANNSEN W L. Elemente der Exakten Erblichkeitslehre
                  [The elements of an exact theory of heredity]. Jena: Gustav
                  Fischer, 1909[J]. 1909.
                </li>
                <li>
                  [37] 曹晓娟, 王静. 浅析“气”字的发展流变及美学范畴[J].
                  汉字文化, 2020, (S2): 82-83.
                </li>
                <li>
                  [38] 郑舒婷. “气”字的形义演变与字际关系[J]. 泉州师范学院学报,
                  2019, 37 (05): 33-36.
                </li>
              </ul>
              <p className='mt-4'></p>
            </article>
          </div>
        </div>

        {/* 介绍内容容器 - 在PC端显示为左栏，在移动端可以通过按钮切换显示 */}
        <div
          className={`w-full md:w-1/3 overflow-y-scroll custom-scrollbar ${
            isMobile ? 'hidden' : 'block'
          }`}
        >
          <article id="introContent" className='prose max-w-none flex-1 p-8'>
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
                Step 2: Observe how the symbol changes based on the sound input
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

        {/* 移动端介绍内容面板 - 使用滑动面板显示相同内容 */}
        {isMobile && (
          <div
            className={`absolute left-0 bottom-0 h-full w-3/4 sm:w-1/2
              bg-gray-200/30 backdrop-blur transition-transform
              duration-300 ease-in-out z-30 ${
                showIntro ? 'translate-x-0' : '-translate-x-full'
              }`}
          >
            {/* 标题和关闭按钮容器 */}
            <div className='sticky top-0 left-0 right-0 h-16 flex items-center justify-between px-4'>
              {/* 标题 - 调整为更小的字体 */}
              <h2 className='text-lg font-black text-[#0c75ff]'>
                Introduction
              </h2>
              {/* 关闭按钮 */}
              <button
                onClick={toggleIntro}
                className='text-4xl leading-none text-[#0c75ff] transition-colors'
              >
                &times;
              </button>
            </div>
            <div className='overflow-y-auto no-scrollbar h-[calc(100%-4rem)]'>
              {/* 使用克隆的内容，避免重复维护 */}
              <div id="mobileIntroContent" className='px-4 mobile-content'>
                {/* 这里的内容将通过JavaScript动态填充 */}
              </div>

              {/* 添加移动端特定的样式 */}
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
        )}

        {/* 右栏画布容器 - 在手机端占满宽度并设置最小高度 */}
        <div className='w-full md:w-2/3 h-full min-h-[60vh] md:min-h-0 overflow-hidden'>
          <MySketch />
        </div>
      </div>
    </div>
  )
}
