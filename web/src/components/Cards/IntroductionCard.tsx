import { VStack, StackProps } from '@chakra-ui/react'
import { ComingSoonButton, GetInTouchTeamButton } from '@/components/Buttons'

type IntroductionCardType = StackProps & {
  title: string
  description: string
  cardType?: string
}

const IntroductionCard = ({ title, description, cardType = 'coming-soon', children, ...props }: IntroductionCardType) => {
  return (
    <VStack
      direction={'column'}
      border={'1px solid #202020'}
      alignItems={'flex-start'}
      borderRadius={'24px'}
      p={{ base: '24px', md: '32px' }}
      h={{ base: '510px', md: '443px' }}
      pos={'relative'}
      {...props}
    >
      <div className='font-medium text-[38px] leading-[30px] z-[101]'>{title}</div>
      <div className='max-w-[334px] font-nomal text-[18px] leading-[24px] text-[#898989] mt-[8px] z-[101]'>{description}</div>
      {cardType === 'coming-soon' && <ComingSoonButton mt={'auto'} zIndex={101} />}
      {cardType === 'get-in-touch-team' && <GetInTouchTeamButton text={'Get in touch with our team'} mt={'auto'} zIndex={101} />}
      {children}
    </VStack>
  )
}

export default IntroductionCard
