import { Service } from '@prisma/client'

interface ChecklistTemplate {
  label:   string
  labelSv: string
}

export function generateChecklist(
  _services: Pick<Service, 'name'>[]
): ChecklistTemplate[] {
  return [
    { label: 'Vacuum all floors',         labelSv: 'Dammsug alla golv' },
    { label: 'Mop hard floors',           labelSv: 'Moppa hårda golv' },
    { label: 'Clean kitchen surfaces',    labelSv: 'Rengör köksbänkar' },
    { label: 'Clean bathroom',            labelSv: 'Rengör badrum' },
    { label: 'Empty all bins',            labelSv: 'Töm alla sopkorgar' },
    { label: 'Wipe mirrors and surfaces', labelSv: 'Torka speglar och ytor' },
  ]
}
