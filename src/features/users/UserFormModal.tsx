import { useState, type FormEvent } from 'react'
import { useSession } from '@/app/SessionContext'
import { useToast } from '@/app/ToastContext'
import { Button, Modal, SelectInput, TextInput } from '@/components/ui'
import { userRoleLabels } from '@/lib/labels'
import { usersService } from '@/services'
import type { UserRole } from '@/types'

export interface UserFormModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

interface Errors {
  name?: string
  email?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function UserFormModal({ open, onClose, onCreated }: UserFormModalProps) {
  const { user } = useSession()
  const { notify } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<UserRole>('agent')
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setName('')
    setEmail('')
    setPhone('')
    setRole('agent')
    setErrors({})
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const validation: Errors = {}
    if (name.trim().length < 3) validation.name = 'Ingresá nombre y apellido.'
    if (!EMAIL_PATTERN.test(email)) validation.email = 'Ingresá un email válido.'
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setSubmitting(true)
    try {
      const created = await usersService.create({ name: name.trim(), email: email.trim(), role, phone: phone || undefined }, user.id)
      notify({
        title: 'Usuario creado',
        description: `${created.name} · ${userRoleLabels[created.role]}. En el sistema real recibiría un email de activación.`,
      })
      reset()
      onCreated()
    } catch (cause) {
      notify({ title: 'No se pudo crear el usuario', description: (cause as Error).message, tone: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Nuevo usuario"
      description="Alta de personal con rol asignado."
      footer={
        <>
          <Button size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" variant="primary" type="submit" form="user-form" disabled={submitting}>
            {submitting ? 'Creando…' : 'Crear usuario'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextInput label="Nombre y apellido" required value={name} onChange={(event) => setName(event.target.value)} error={errors.name} />
        <TextInput label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} />
        <TextInput label="Teléfono" value={phone} onChange={(event) => setPhone(event.target.value)} />
        <SelectInput
          label="Rol"
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
          options={(Object.keys(userRoleLabels) as UserRole[]).map((key) => ({ value: key, label: userRoleLabels[key] }))}
          hint="El rol define qué módulos puede ver y modificar."
        />
      </form>
    </Modal>
  )
}
