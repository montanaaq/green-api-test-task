import { TextInput } from '@mantine/core'
import { useMask } from '@siberiacancode/reactuse'

interface PhoneInputProps {
  onChange: (phone: string) => void
  disabled: boolean
}

const PhoneInput = ({ onChange, disabled }: PhoneInputProps) => {
  const phone = useMask('+9 (999) 999-99-99', {
    showMask: 'filled',
    onChangeRaw: onChange
  })

  return (
    <TextInput
      {...phone.register()}
      id="phone"
      name="phone"
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      label="Номер телефона"
      description="Номер РФ в международном формате"
      placeholder="+7 999 123-45-67"
      size="md"
      disabled={disabled}
      required
    />
  )
}

export default PhoneInput
