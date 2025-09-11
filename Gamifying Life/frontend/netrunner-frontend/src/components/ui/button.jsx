// src/components/ui/button.jsx
import React from 'react'

const ButtonBase = React.forwardRef(({ className = '', ...props }, ref) => {
  return <button ref={ref} className={className} {...props} />
})
ButtonBase.displayName = 'Button'

export const Button = ButtonBase
export default ButtonBase
