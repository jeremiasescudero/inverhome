import { ImagePlus, Save, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSession } from '@/app/SessionContext'
import { useToast } from '@/app/ToastContext'
import {
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  ErrorState,
  ImagePlaceholder,
  LoadingState,
  PageContainer,
  PageHeader,
  SelectInput,
  TextArea,
  TextInput,
} from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { operationKindLabels, propertyStatusMeta, propertyTypeLabels } from '@/lib/labels'
import { clientsService, propertiesService, usersService } from '@/services'
import type { Currency, OperationKind, Property, PropertyDraft, PropertyStatus, PropertyType, User } from '@/types'
import { EMPTY_DRAFT, draftFromProperty, validateDraft, type DraftErrors } from './propertyForm'

function enumOptions<T extends string>(labels: Record<T, string>) {
  return (Object.keys(labels) as T[]).map((key) => ({ value: key, label: labels[key] }))
}

/**
 * Loads the data the form depends on (existing property, owner and agent
 * options) and only then mounts the form, so its state can be initialised
 * directly from props instead of being synchronised with effects.
 */
export function PropertyFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  const existing = useAsync(
    () => (id ? propertiesService.getById(id) : Promise.resolve(undefined)),
    [id],
  )
  const owners = useAsync(() => clientsService.options('owner'), [])
  const agents = useAsync(() => usersService.agents(), [])

  const loading = existing.loading || owners.loading || agents.loading
  const error = existing.error ?? owners.error ?? agents.error

  if (loading) {
    return (
      <PageContainer>
        <LoadingState rows={6} />
      </PageContainer>
    )
  }
  if (error || !owners.data || !agents.data) {
    return (
      <PageContainer>
        <ErrorState
          description={error?.message}
          onRetry={() => {
            existing.reload()
            owners.reload()
            agents.reload()
          }}
        />
      </PageContainer>
    )
  }

  const property = existing.data?.property
  const initial: PropertyDraft = property
    ? draftFromProperty(property)
    : {
        ...EMPTY_DRAFT,
        // Pickers default to the first option so a new property is always
        // valid on the relation fields; the reviewer only types the rest.
        ownerId: owners.data[0]?.id ?? '',
        agentId: agents.data[0]?.id ?? '',
      }

  return (
    <PropertyForm
      key={id ?? 'new'}
      id={id}
      isEdit={isEdit}
      property={property}
      initial={initial}
      owners={owners.data}
      agents={agents.data}
    />
  )
}

interface PropertyFormProps {
  id?: string
  isEdit: boolean
  property?: Property
  initial: PropertyDraft
  owners: { id: string; label: string }[]
  agents: User[]
}

function PropertyForm({ id, isEdit, property, initial, owners, agents }: PropertyFormProps) {
  const navigate = useNavigate()
  const { user } = useSession()
  const { notify } = useToast()

  const [draft, setDraft] = useState<PropertyDraft>(initial)
  const [images, setImages] = useState<string[]>(property?.images ?? [])
  const [errors, setErrors] = useState<DraftErrors>({})
  const [submitting, setSubmitting] = useState(false)
  function patch<K extends keyof PropertyDraft>(key: K, value: PropertyDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function patchLocation<K extends keyof PropertyDraft['location']>(
    key: K,
    value: PropertyDraft['location'][K],
  ) {
    setDraft((current) => ({ ...current, location: { ...current.location, [key]: value } }))
  }

  function patchFeature<K extends keyof PropertyDraft['features']>(
    key: K,
    value: PropertyDraft['features'][K],
  ) {
    setDraft((current) => ({ ...current, features: { ...current.features, [key]: value } }))
  }

  function addImage() {
    setImages((current) => [...current, `Imagen ${current.length + 1}`])
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const validation = validateDraft(draft)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setSubmitting(true)
    try {
      const saved = isEdit
        ? await propertiesService.update(id!, draft, user.id)
        : await propertiesService.create(draft, user.id)
      if (images.length > 0) saved.images = images
      notify({
        title: isEdit ? 'Propiedad actualizada' : 'Propiedad creada',
        description: `${saved.code} · ${saved.title}`,
      })
      navigate(`/propiedades/${saved.id}`)
    } catch (cause) {
      notify({
        title: 'No se pudo guardar la propiedad',
        description: cause instanceof Error ? cause.message : undefined,
        tone: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const numberValue = (value: number) => (Number.isNaN(value) ? '' : String(value))

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: 'Propiedades', to: '/propiedades' },
          ...(property ? [{ label: property.code, to: `/propiedades/${id}` }] : []),
          { label: isEdit ? 'Editar' : 'Nueva propiedad' },
        ]}
        title={isEdit ? `Editar ${property?.code ?? ''}` : 'Nueva propiedad'}
        description="Los cambios se guardan sólo en la sesión de la demo."
      />

      <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5 xl:col-span-2">
          <Card>
            <CardHeader title="Información básica" />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextInput
                label="Título"
                required
                className="sm:col-span-2"
                value={draft.title}
                onChange={(event) => patch('title', event.target.value)}
                error={errors.title}
                placeholder="Departamento 2 dormitorios en Nueva Córdoba"
              />
              <SelectInput
                label="Operación"
                value={draft.operation}
                onChange={(event) => patch('operation', event.target.value as OperationKind)}
                options={enumOptions(operationKindLabels)}
              />
              <SelectInput
                label="Tipo"
                value={draft.type}
                onChange={(event) => patch('type', event.target.value as PropertyType)}
                options={enumOptions(propertyTypeLabels)}
              />
              <SelectInput
                label="Estado"
                value={draft.status}
                onChange={(event) => patch('status', event.target.value as PropertyStatus)}
                options={(Object.keys(propertyStatusMeta) as PropertyStatus[]).map((key) => ({
                  value: key,
                  label: propertyStatusMeta[key].label,
                }))}
              />
              <Checkbox
                label="Publicada en portales"
                hint="Las propiedades sin publicar aparecen como alerta en el dashboard."
                className="self-end pb-1"
                checked={draft.published}
                onChange={(event) => patch('published', event.target.checked)}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Ubicación" />
            <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <TextInput
                label="Calle"
                required
                className="col-span-2 sm:col-span-3"
                value={draft.location.street}
                onChange={(event) => patchLocation('street', event.target.value)}
                error={errors.street}
              />
              <TextInput
                label="Número"
                required
                value={draft.location.number}
                onChange={(event) => patchLocation('number', event.target.value)}
                error={errors.number}
              />
              <TextInput
                label="Piso"
                value={draft.location.floor ?? ''}
                onChange={(event) => patchLocation('floor', event.target.value || undefined)}
              />
              <TextInput
                label="Unidad"
                value={draft.location.unit ?? ''}
                onChange={(event) => patchLocation('unit', event.target.value || undefined)}
              />
              <TextInput
                label="Barrio"
                required
                className="col-span-2"
                value={draft.location.neighborhood}
                onChange={(event) => patchLocation('neighborhood', event.target.value)}
                error={errors.neighborhood}
              />
              <TextInput
                label="Ciudad"
                className="col-span-2"
                value={draft.location.city}
                onChange={(event) => patchLocation('city', event.target.value)}
              />
              <TextInput
                label="Provincia"
                className="col-span-2"
                value={draft.location.province}
                onChange={(event) => patchLocation('province', event.target.value)}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Características" />
            <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <TextInput
                label="Superficie total (m²)"
                type="number"
                min={0}
                required
                value={numberValue(draft.features.totalArea)}
                onChange={(event) => patchFeature('totalArea', Number(event.target.value))}
                error={errors.totalArea}
              />
              <TextInput
                label="Superficie cubierta (m²)"
                type="number"
                min={0}
                value={numberValue(draft.features.coveredArea)}
                onChange={(event) => patchFeature('coveredArea', Number(event.target.value))}
                error={errors.coveredArea}
              />
              <TextInput
                label="Ambientes"
                type="number"
                min={0}
                value={numberValue(draft.features.rooms)}
                onChange={(event) => patchFeature('rooms', Number(event.target.value))}
              />
              <TextInput
                label="Dormitorios"
                type="number"
                min={0}
                value={numberValue(draft.features.bedrooms)}
                onChange={(event) => patchFeature('bedrooms', Number(event.target.value))}
              />
              <TextInput
                label="Baños"
                type="number"
                min={0}
                value={numberValue(draft.features.bathrooms)}
                onChange={(event) => patchFeature('bathrooms', Number(event.target.value))}
              />
              <TextInput
                label="Cocheras"
                type="number"
                min={0}
                value={numberValue(draft.features.garage)}
                onChange={(event) => patchFeature('garage', Number(event.target.value))}
              />
              <TextInput
                label="Antigüedad (años)"
                type="number"
                min={0}
                value={numberValue(draft.features.ageYears)}
                onChange={(event) => patchFeature('ageYears', Number(event.target.value))}
              />
              <TextInput
                label="Expensas (ARS)"
                type="number"
                min={0}
                value={draft.features.expenses ?? ''}
                onChange={(event) =>
                  patchFeature('expenses', event.target.value ? Number(event.target.value) : undefined)
                }
              />
              <TextInput
                label="Comodidades"
                hint="Separadas por coma."
                className="col-span-2 sm:col-span-4"
                value={draft.features.amenities.join(', ')}
                onChange={(event) =>
                  patchFeature(
                    'amenities',
                    event.target.value
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  )
                }
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Descripción comercial" />
            <CardBody>
              <TextArea
                label="Descripción"
                required
                value={draft.description}
                onChange={(event) => patch('description', event.target.value)}
                error={errors.description}
                hint="Mínimo 40 caracteres. Es el texto que se publica en los portales."
              />
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Precio" />
            <CardBody className="grid grid-cols-3 gap-3">
              <TextInput
                label="Monto"
                type="number"
                min={0}
                required
                className="col-span-2"
                value={numberValue(draft.priceAmount)}
                onChange={(event) => patch('priceAmount', Number(event.target.value))}
                error={errors.priceAmount}
              />
              <SelectInput
                label="Moneda"
                value={draft.priceCurrency}
                onChange={(event) => patch('priceCurrency', event.target.value as Currency)}
                options={[
                  { value: 'USD', label: 'USD' },
                  { value: 'ARS', label: 'ARS' },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Responsables" />
            <CardBody className="flex flex-col gap-4">
              <SelectInput
                label="Propietario"
                required
                value={draft.ownerId}
                onChange={(event) => patch('ownerId', event.target.value)}
                error={errors.ownerId}
                options={[
                  { value: '', label: 'Seleccionar…' },
                  ...owners.map((owner) => ({ value: owner.id, label: owner.label })),
                ]}
              />
              <SelectInput
                label="Agente"
                required
                value={draft.agentId}
                onChange={(event) => patch('agentId', event.target.value)}
                error={errors.agentId}
                options={[
                  { value: '', label: 'Seleccionar…' },
                  ...agents.map((agent) => ({ value: agent.id, label: agent.name })),
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Fotos"
              description="La demo no sube archivos: se agregan imágenes de referencia."
              actions={
                <Button size="sm" onClick={addImage} icon={<ImagePlus className="size-3.5" aria-hidden="true" />}>
                  Agregar
                </Button>
              }
            />
            <CardBody>
              {images.length === 0 ? (
                <p className="text-xs text-slate-500">Todavía no hay imágenes cargadas.</p>
              ) : (
                <ul className="grid grid-cols-3 gap-2">
                  {images.map((caption, index) => (
                    <li key={`${caption}-${index}`} className="relative">
                      <ImagePlaceholder caption={caption} seed={`${draft.title}-${caption}`} className="h-16 rounded-md" showCaption={false} />
                      <button
                        type="button"
                        aria-label={`Quitar ${caption}`}
                        onClick={() => setImages((current) => current.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 rounded bg-white/90 p-0.5 text-slate-600 hover:text-rose-700"
                      >
                        <X className="size-3" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Documentación" />
            <CardBody>
              <p className="text-xs text-slate-500">
                Escritura, planos e impuestos se adjuntan desde la ficha de la propiedad una vez
                creada. El almacenamiento real de archivos queda fuera del alcance de la demo.
              </p>
            </CardBody>
          </Card>

          <div className="flex flex-col gap-2">
            <Button type="submit" variant="primary" disabled={submitting} icon={<Save className="size-4" aria-hidden="true" />}>
              {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear propiedad'}
            </Button>
            <ButtonLink to={isEdit ? `/propiedades/${id}` : '/propiedades'} variant="ghost">
              Cancelar
            </ButtonLink>
            {Object.keys(errors).length > 0 && (
              <p className="text-xs text-rose-700" role="alert">
                Revisá los campos marcados antes de guardar.
              </p>
            )}
          </div>
        </div>
      </form>
    </PageContainer>
  )
}
