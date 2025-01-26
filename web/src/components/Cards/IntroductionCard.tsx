'use client'

import { VStack, StackProps } from '@chakra-ui/react'
import { ComingSoonButton, GetInTouchTeamButton } from '@/components/Buttons'
import { motion } from 'framer-motion'

type IntroductionCardType = StackProps & {
  title: string
  description: string
  cardType?: 'coming-soon' | 'get-in-touch-team'
}

const IntroductionCard = ({ title, description, cardType = 'coming-soon', children, ...props }: IntroductionCardType) => {
  return (
    <VStack
      as={motion.div}
      border={'1px solid #202020'}
      alignItems={'flex-start'}
      borderRadius={'24px'}
      p={{ base: '24px', md: '32px' }}
      h={{ base: '510px', md: '443px' }}
      pos={'relative'}
      bgSize={'cover'}
      bgPos={'right'}
      {...props}
    >
      <div className='font-medium text-[38px] leading-[30px] z-[101]'>{title}</div>
      <div className='max-w-[334px] font-nomal text-[18px] leading-[24px] text-[#898989] mt-[8px] z-[101]'>{description}</div>
      {cardType === 'coming-soon' && <ComingSoonButton mt={'auto'} zIndex={101} />}
      {cardType === 'get-in-touch-team' && <GetInTouchTeamButton mt={'auto'} zIndex={101} />}
      {children}
    </VStack>
  )
}

export default IntroductionCard
