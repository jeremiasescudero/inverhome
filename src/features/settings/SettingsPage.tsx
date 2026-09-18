import { Save } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useSession } from '@/app/SessionContext'
import { useToast } from '@/app/ToastContext'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  DescriptionList,
  PageContainer,
  PageHeader,
  SelectInput,
  TextInput,
} from '@/components/ui'
import { formatNumber } from '@/lib/format'
import { MOCK_USD_ARS } from '@/services'

/**
 * Settings are intentionally shallow in the demo: they show which parameters
 * the real system will expose (spec section 4, "parcialmente mockeadas") and
 * document the security features planned for the production version.
 */
export function SettingsPage() {
  const { can } = useSession()
  const { notify } = useToast()
  const editable = can('settings.manage')

  const [companyName, setCompanyName] = useState('Inverhome Negocios Inmobiliarios')
  const [cuit, setCuit] = useState('30-71234567-9')
  const [saleCommission, setSaleCommission] = useState('3')
  const [rentFee, setRentFee] = useState('10')
  const [adjustmentMonths, setAdjustmentMonths] = useState('6')
  const [notifyContracts, setNotifyContracts] = useState(true)
  const [notifyPayments, setNotifyPayments] = useState(true)
  const [notifyLeads, setNotifyLeads] = useState(false)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    notify({ title: 'Configuración guardada', description: 'Los cambios aplican sólo a esta sesión de la demo.' })
  }

  return (
    <PageContainer>
      <PageHeader
        title="Configuración"
        description="Parámetros generales de la inmobiliaria y lineamientos de seguridad del sistema."
        meta={!editable && <Badge tone="attention">Sólo lectura para tu rol</Badge>}
      />

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Empresa" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput label="Razón social" value={companyName} onChange={(event) => setCompanyName(event.target.value)} disabled={!editable} className="sm:col-span-2" />
            <TextInput label="CUIT" value={cuit} onChange={(event) => setCuit(event.target.value)} disabled={!editable} />
            <SelectInput
              label="Moneda de referencia para reportes"
              value="ARS"
              disabled
              options={[{ value: 'ARS', label: 'Pesos argentinos (ARS)' }]}
              hint={`Cotización USD de referencia en la demo: ${formatNumber(MOCK_USD_ARS)}.`}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Comisiones y contratos" description="Valores por defecto al crear operaciones." />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TextInput label="Comisión por venta (%)" type="number" min={0} step="0.5" value={saleCommission} onChange={(event) => setSaleCommission(event.target.value)} disabled={!editable} />
            <TextInput label="Honorarios por alquiler (%)" type="number" min={0} step="0.5" value={rentFee} onChange={(event) => setRentFee(event.target.value)} disabled={!editable} />
            <TextInput label="Ajuste de alquiler (meses)" type="number" min={1} value={adjustmentMonths} onChange={(event) => setAdjustmentMonths(event.target.value)} disabled={!editable} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Notificaciones" />
          <CardBody className="flex flex-col gap-3">
            <Checkbox label="Avisar contratos próximos a vencer" hint="60 días antes del vencimiento." checked={notifyContracts} onChange={(event) => setNotifyContracts(event.target.checked)} disabled={!editable} />
            <Checkbox label="Avisar pagos vencidos" checked={notifyPayments} onChange={(event) => setNotifyPayments(event.target.checked)} disabled={!editable} />
            <Checkbox label="Avisar leads sin seguimiento" hint="Leads nuevos sin contacto por más de 48 h." checked={notifyLeads} onChange={(event) => setNotifyLeads(event.target.checked)} disabled={!editable} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Seguridad" description="Previsto para la versión productiva; no implementado en la demo." />
          <CardBody>
            <DescriptionList
              columns={2}
              items={[
                { label: 'Autenticación', value: 'Contraseñas hasheadas, recuperación por email, MFA/2FA, bloqueo por intentos fallidos.' },
                { label: 'Autorización', value: 'RBAC + permisos por recurso validados en la API, no sólo en la interfaz.' },
                { label: 'Datos sensibles', value: 'DNI, CUIT, contactos, datos bancarios y documentos con acceso restringido.' },
                { label: 'Archivos', value: 'Storage privado con URLs temporales; sin enlaces públicos permanentes.' },
                { label: 'Auditoría', value: 'Registro de creación, modificación, eliminación, precios, permisos y movimientos financieros.' },
                { label: 'Backups', value: 'Automáticos, en almacenamiento externo, con retención y pruebas de restauración.' },
              ]}
            />
          </CardBody>
        </Card>

        {editable && (
          <div className="xl:col-span-2">
            <Button type="submit" variant="primary" icon={<Save className="size-4" aria-hidden="true" />}>
              Guardar configuración
            </Button>
          </div>
        )}
      </form>
    </PageContainer>
  )
}
