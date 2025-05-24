import { memo } from 'react'
import { STYLES, ANIMATION_CONFIG, NAV_ITEMS } from '@/constants'

// 引用面板组件
export const ReferencePanel = memo(({ showReference, onClose }) => {
  return (
    <div
      className={`absolute left-0 bottom-0 h-[calc(100%-3rem)] w-[calc(33.3%-8px)]
        ${STYLES.panel} transition-transform ${ANIMATION_CONFIG.panelTransition} z-20 hidden md:block ${
          showReference ? 'translate-x-0' : '-translate-x-full'
        }`}
    >
      <div className='sticky top-0 left-0 right-0 h-16 flex items-center justify-between px-6'>
        <h2 className='text-2xl font-black text-[#0c75ff]'>Reference</h2>
        <button
          onClick={onClose}
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
            <li>[3] 刘凤君. 中国早期文字骨刻文的发现与研究[J].档案,2017,(03):5-13.</li>
            <li>[4] International Organization for Standardization. Graphical symbols — Vocabulary[OL].(2003)[2025-01-16].</li>
            <li>[5] 唐兰.古文字学导论[M].齐魯书社,1981.</li>
            <li>[6] 唐兰.中国文字学[M].上海古籍出版社,2005.</li>
            <li>[7] 牛清波.中国早期刻画符号整理与研究[D].安徽大学,2013.</li>
            <li>[8] 陈楠.再造·甲骨——现代设计语境中的甲骨文创新设计[J].装饰,2018,(05):104-107.</li>
            <li>[9] 莫伯峰,张重生.以多模态大模型推动中国古文字研究发展[J].中国语言战略,2024,11(02):37-47.</li>
            <li>[10] 徐加跃,李春桃.大语言模型时代古文字研究的机遇与挑战[J].中国语言战略,2024,11(02):48-58.</li>
            <li>[11] Meng, Lin. "Recognition of Oracle Bone Inscriptions by Extracting Line Features on Image Processing." ICPRAM. 2017.</li>
            <li>[12] Gao, Junheng, and Xun Liang. "Distinguishing oracle variants based on the isomorphism and symmetry invariances of oracle-bone inscriptions." IEEE Access 8 (2020): 152258-152275.</li>
            <li>[13] 刘钊.古文字构型学[M].福建人民出版社,2006.</li>
            <li>[14] 王筠. 说文释例[M].中华书局,1987.</li>
            <li>[15] 孙怡让. 古籀拾遗[M].中华书局,1989.</li>
            <li>[16] 姚孝遂. 古文字的符号化问题[J]. 香港中文大学: 古文字学论集, 1983, 116.</li>
            <li>[17] 冯振安.中国古文字造型与现代设计研究[D].江南大学,2005.</li>
            <li>[18] 刑立志.拟真与超越：甲骨文造型艺术语言与视觉图式探析[J].今古文创,2021,(30):95-96.</li>
            <li>[19] 薛伟明.符号学视角下甲骨文造型的意象特征与审美意义[J].南京师范大学文学院学报,2021,(02):88-93.</li>
            <li>[20] 王璇.《说文解字》的设计解读[D].南京艺术学院,2017.</li>
            <li>[21] 李月怡.基于东巴文图形特征的汉字字体设计应用研究[D].云南师范大学,2019.</li>
            <li>[22] 唐绍钧.东巴文字解构设计研究及其在现代平面设计中的应用[D].昆明理工大学,2009.</li>
            <li>[23] 胡江升,赵晓芳.甲骨文在现代设计中的应用研究[J].天工,2022,(21):48-50.</li>
            <li>[24] 姜在新,曹祎蕾.甲骨文意象美在现代设计中的应用[J].炎黄地理,2022,(05):31-33.</li>
            <li>[25] 陈楠.格律的设计——甲骨文、东巴文的概念设计与应用[C]//汕头大学长江艺术与设计学院,清华大学美术学院."岁寒三友——诗意的设计"——两岸三地中国传统图形与现代视觉设计学术研讨会论文集.清华大学美术学院装潢艺术设计系,2004:14.</li>
            <li>[26] 汉字"合文"现象在近现代标志设计中应用的研究[D].西南大学, 2021.</li>
            <li>[27] 李金蔓. 寻古鉴今[D].南京艺术学院, 2021.</li>
            <li>[28] 梁桓彬. 汉字构形与表意视觉设计研究[D].中国美术学院, 2023.</li>
            <li>[29] 骆冬青.象形、象意与表意——论汉字审美符号的存在方式[J].南京师大学报(社会科学版),2014,(05):141-147.</li>
            <li>[30] 曹雪.会意字构形演变研究[D].西北大学,2017.</li>
            <li>[31] 陈炜湛. 甲骨文简论[M]. 上海古籍出版社, 1987.</li>
            <li>[32] 马晓风.甲骨文会意字研究[D].陕西师范大学,2005.</li>
            <li>[33] Peirce C S. Collected papers of charles sanders peirce[M]. Harvard University Press, 1934.</li>
            <li>[34] Neurath M. Isotype[J]. Instructional science, 1974: 127-150.</li>
            <li>[35] Aicher O. World as Design: Writings of Design[M]. John Wiley & Sons, 1994.</li>
            <li>[36] JOHANNSEN W L. Elemente der Exakten Erblichkeitslehre [The elements of an exact theory of heredity]. Jena: Gustav Fischer, 1909[J]. 1909.</li>
            <li>[37] 曹晓娟, 王静. 浅析"气"字的发展流变及美学范畴[J]. 汉字文化, 2020, (S2): 82-83.</li>
            <li>[38] 郑舒婷. "气"字的形义演变与字际关系[J]. 泉州师范学院学报, 2019, 37 (05): 33-36.</li>
          </ul>
          <p className='mt-4'></p>
        </article>
      </div>
    </div>
  )
})

// PC端字符导航面板组件
export const DesktopNavigationPanel = memo(({ showNavigation, onClose, onNavItemClick }) => {
  return (
    <div
      className={`absolute right-0 bottom-0 h-[calc(100%-3rem)] w-[calc(33.3%-8px)]
        ${STYLES.panel} transition-transform ${ANIMATION_CONFIG.panelTransition} z-20 hidden md:block ${
          showNavigation ? 'translate-x-0' : 'translate-x-full'
        }`}
    >
      <div className='sticky top-0 left-0 right-0 h-16 flex items-center justify-between px-6'>
        <h2 className='text-2xl font-black text-[#0c75ff]'>Characters</h2>
        <button
          onClick={onClose}
          className='text-5xl leading-none text-[#0c75ff] transition-colors'
        >
          &times;
        </button>
      </div>
      <div className='overflow-y-auto no-scrollbar h-[calc(100%-4rem)] p-6'>
        <div className='grid grid-cols-3 gap-4'>
          {NAV_ITEMS.map((item) => (
            <div 
              key={item.id} 
              className='flex flex-col items-center cursor-pointer hover:bg-white/20 rounded-lg p-3 transition-colors'
              onClick={() => onNavItemClick(item.id)}
            >
              <div className='w-full aspect-square mb-2 relative'>
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className='w-full h-full object-contain' 
                />
              </div>
              <span className='text-sm font-medium'>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

// 介绍内容组件
export const IntroContent = memo(() => {
  return (
    <div className='h-full bg-gray-200/30 backdrop-blur'>
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
          <li>Step 1: Click the Start button and tell the computer any sound you want to make</li>
          <li>Step 2: Observe how the symbol changes based on the sound input</li>
          <li>Step 3: You can select the switch button to switch between different symbols for interaction</li>
          <li>Note: You can choose to press the Pause button to stop the interaction</li>
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
          <li>A method of "shape, meaning and sound" reconstruction is proposed to achieve multimodal fusion of Chinese characters.</li>
          <li>Construct a "shape, meaning and sound" digital symbol library and explore real-time symbol generation based on parameterization.</li>
          <li>Explore the mapping relationship between sound and graphic symbols, and propose a symbol visualization method based on phonological features.</li>
        </ul>
      </article>
    </div>
  )
}) 