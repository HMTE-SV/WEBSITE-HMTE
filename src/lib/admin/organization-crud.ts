import type { DivisionCode, ProgramStatus } from '@/types/content'
import type {
  DivisionDocument,
  FirestoreCollectionName,
  LeaderDocument,
  ProgramDocument,
} from '@/types/firestore'

export type OrganizationKind = 'leaders' | 'divisions' | 'programs'

export type OrganizationFormValues = {
  active: boolean
  bio: string
  code: DivisionCode
  date: string
  desc: string
  description: string
  divisionCode: DivisionCode
  email: string
  instagram: string
  linkedin: string
  name: string
  order: string
  photo: string
  programStatus: ProgramStatus
  role: string
  shortName: string
}

export type ManagedOrganizationDocument = LeaderDocument | DivisionDocument | ProgramDocument

type OrganizationCrudConfig = {
  collectionName: Extract<FirestoreCollectionName, OrganizationKind>
  kind: OrganizationKind
  label: string
}

export const organizationCrudConfigs = {
  leaders: {
    collectionName: 'leaders',
    kind: 'leaders',
    label: 'Pengurus',
  },
  divisions: {
    collectionName: 'divisions',
    kind: 'divisions',
    label: 'Divisi',
  },
  programs: {
    collectionName: 'programs',
    kind: 'programs',
    label: 'Program Kerja',
  },
} as const satisfies Record<OrganizationKind, OrganizationCrudConfig>

function parseOrder(value: string) {
  const order = Number.parseInt(value, 10)
  return Number.isFinite(order) ? order : 0
}

export function getEmptyOrganizationFormValues(kind: OrganizationKind): OrganizationFormValues {
  return {
    active: true,
    bio: '',
    code: 'PH',
    date: '',
    desc: '',
    description: '',
    divisionCode: 'PH',
    email: '',
    instagram: '',
    linkedin: '',
    name: '',
    order: '0',
    photo: '',
    programStatus: 'Terencana',
    role: '',
    shortName: kind === 'divisions' ? 'PH' : '',
  }
}

export function buildOrganizationPayload(kind: OrganizationKind, values: OrganizationFormValues) {
  const basePayload = {
    active: values.active,
    order: parseOrder(values.order),
  }

  if (kind === 'leaders') {
    return {
      ...basePayload,
      bio: values.bio.trim(),
      divisionCode: values.divisionCode,
      email: values.email.trim(),
      instagram: values.instagram.trim(),
      linkedin: values.linkedin.trim(),
      name: values.name.trim(),
      photo: values.photo.trim(),
      role: values.role.trim(),
    } satisfies Omit<LeaderDocument, 'id' | 'createdAt' | 'updatedAt'>
  }

  if (kind === 'divisions') {
    return {
      ...basePayload,
      code: values.code,
      description: values.description.trim(),
      name: values.name.trim(),
      shortName: values.shortName.trim(),
    } satisfies Omit<DivisionDocument, 'id' | 'createdAt' | 'updatedAt'>
  }

  return {
    ...basePayload,
    date: values.date.trim(),
    desc: values.desc.trim(),
    divisionCode: values.divisionCode,
    name: values.name.trim(),
    status: values.programStatus,
  } satisfies Omit<ProgramDocument, 'id' | 'createdAt' | 'updatedAt'>
}

export function organizationDocumentToFormValues(
  kind: OrganizationKind,
  document: ManagedOrganizationDocument,
): OrganizationFormValues {
  const values = getEmptyOrganizationFormValues(kind)

  if (kind === 'leaders') {
    const leader = document as LeaderDocument
    return {
      ...values,
      active: leader.active,
      bio: leader.bio || '',
      divisionCode: leader.divisionCode || 'PH',
      email: leader.email || '',
      instagram: leader.instagram || '',
      linkedin: leader.linkedin || '',
      name: leader.name,
      order: String(leader.order),
      photo: leader.photo,
      role: leader.role,
    }
  }

  if (kind === 'divisions') {
    const division = document as DivisionDocument
    return {
      ...values,
      active: division.active,
      code: division.code,
      description: division.description,
      name: division.name,
      order: String(division.order),
      shortName: division.shortName,
    }
  }

  const program = document as ProgramDocument
  return {
    ...values,
    active: program.active,
    date: program.date,
    desc: program.desc,
    divisionCode: program.divisionCode,
    name: program.name,
    order: String(program.order),
    programStatus: program.status,
  }
}
