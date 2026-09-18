import { useState, type FormEvent } from 'react'
import { useSession } from '@/app/SessionContext'
import { useToast } from '@/app/ToastContext'
import { Button, Modal, SelectInput, TextInput } from '@/components/ui'
import { formatMoney, formatPeriod } from '@/lib/format'
import { paymentMethodLabels } from '@/lib/labels'
import { DEMO_TODAY } from '@/mocks/db'
import { paymentsService } from '@/services'
import type { PaymentMethod } from '@/types'

export interface RegisterPaymentTarget {
  id: string
  code: string
  period: string
  amount: { amount: number; currency: 'ARS' | 'USD' }
  tenantName: string
}

export interface RegisterPaymentModalProps {
  payment: RegisterPaymentTarget | undefined
  onClose: () => void
  onRegistered: () => void
}

/** Marks a rent payment as paid; shared by the payments list and the rental detail. */
export function RegisterPaymentModal({ payment, onClose, onRegistered }: RegisterPaymentModalProps) {
  const { user } = useSession()
  const { notify } = useToast()
  const [method, setMethod] = useState<PaymentMethod>('transfer')
  const [paidAt, setPaidAt] = useState(DEMO_TODAY)
  const [error, setError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!payment) return
    if (!paidAt) {
      setError('Ingresá la fecha de pago.')
      return
    }
    setSubmitting(true)
    try {
      await paymentsService.registerPayment(payment.id, { method, paidAt }, user.id)
      notify({ title: 'Pago registrado', description: `${payment.code} · ${formatMoney(payment.amount)}` })
      onRegistered()
      onClose()
    } catch (cause) {
      notify({ title: 'No se pudo registrar el pago', description: (cause as Error).message, tone: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={Boolean(payment)}
      onClose={onClose}
      title="Registrar pago"
      description={payment ? `${payment.code} · ${formatPeriod(payment.period)} · ${payment.tenantName}` : undefined}
      size="sm"
      footer={
        <>
          <Button size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" variant="primary" type="submit" form="register-payment-form" disabled={submitting}>
            {submitting ? 'Registrando…' : 'Confirmar pago'}
          </Button>
        </>
      }
    >
      {payment && (
        <form id="register-payment-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Monto a registrar:{' '}
            <span className="font-semibold tabular-nums text-slate-900">{formatMoney(payment.amount)}</span>
          </p>
          <SelectInput
            label="Medio de pago"
            value={method}
            onChange={(event) => setMethod(event.target.value as PaymentMethod)}
            options={(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((key) => ({
              value: key,
              label: paymentMethodLabels[key],
            }))}
          />
          <TextInput
            label="Fecha de pago"
            type="date"
            required
            value={paidAt}
            error={error}
            onChange={(event) => {
              setPaidAt(event.target.value)
              setError(undefined)
            }}
          />
          <p className="text-2xs text-slate-500">
            El comprobante se genera en el sistema real; en la demo sólo se actualiza el estado.
          </p>
        </form>
      )}
    </Modal>
  )
}
