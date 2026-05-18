import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning old recruitment data...')
  await prisma.entretien.deleteMany()
  await prisma.application.deleteMany()
  await prisma.candidat.deleteMany()
  await prisma.jobOffer.deleteMany()
  await prisma.notification.deleteMany({ where: { type: { in: ['APPLICATION_RECEIVED', 'INTERVIEW_SCHEDULED', 'APPLICATION_ACCEPTED', 'APPLICATION_REJECTED'] } } })

  console.log('Seeding recruitment data...')

  // 1. Création des Offres d'Emploi
  const offer1 = await prisma.jobOffer.create({
    data: {
      title: 'Développeur Fullstack React & Node.js',
      description: 'Nous recherchons un développeur passionné pour concevoir et faire évoluer nos applications internes de gestion des ressources humaines.\n\nPrérequis:\n- 3 ans d\'expérience minimum\n- Maîtrise de React, TailwindCSS, Node.js et Express\n- Expérience avec TypeScript et Prisma ORM.',
      department: 'Informatique',
      contract_type: 'CDI',
      salary: '45 000 - 55 000 DZD',
      location: 'Alger, Algérie',
      status: 'Published',
      date_publication: new Date(),
      date_expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // dans 30 jours
    }
  })

  const offer2 = await prisma.jobOffer.create({
    data: {
      title: 'Chargé de Recrutement & RH',
      description: 'Sous la direction du DRH, vous serez en charge de l\'ensemble du processus de recrutement, de la définition des besoins avec les managers opérationnels jusqu\'à l\'onboarding des collaborateurs.',
      department: 'Ressources Humaines',
      contract_type: 'CDD',
      salary: '35 000 - 45 000 DZD',
      location: 'Alger, Algérie',
      status: 'Published',
      date_publication: new Date(),
      date_expiration: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // dans 15 jours
    }
  })

  const offer3 = await prisma.jobOffer.create({
    data: {
      title: 'Administrateur Systèmes & Réseaux',
      description: 'Vous gérerez le parc informatique, les serveurs de production sous Linux/Windows et assurerez le bon fonctionnement des infrastructures réseau locales.',
      department: 'Informatique',
      contract_type: 'CDI',
      salary: '50 000 - 65 000 DZD',
      location: 'Oran, Algérie',
      status: 'Draft', // Brouillon
    }
  })

  // 2. Création des Candidats
  const cand1 = await prisma.candidat.create({
    data: {
      nom: 'Benamar',
      prenom: 'Sarah',
      email: 'sarah.benamar@gmail.com',
      telephone: '+213 555 12 34 56',
      address: 'Didouche Mourad, Alger',
      date_inscription: new Date(),
      cv_path: 'uploads/recruitment/sarah-cv-mock.pdf',
    }
  })

  const cand2 = await prisma.candidat.create({
    data: {
      nom: 'Meziani',
      prenom: 'Amine',
      email: 'amine.meziani@yahoo.fr',
      telephone: '+213 661 98 76 54',
      address: 'Bir Mourad Raïs, Alger',
      date_inscription: new Date(),
      cv_path: 'uploads/recruitment/amine-cv-mock.pdf',
    }
  })

  // 3. Création des Candidatures
  const app1 = await prisma.application.create({
    data: {
      id_cand: cand1.id_cand,
      id_offer: offer1.id_offer,
      status: 'Reçue',
      notes: 'Excellente candidature, a l\'air très motivée lors du premier contact mail.',
    }
  })

  const app2 = await prisma.application.create({
    data: {
      id_cand: cand2.id_cand,
      id_offer: offer2.id_offer,
      status: 'Entretien',
      notes: 'Profil correspondant bien aux attentes du poste de Chargé RH.',
    }
  })

  // 4. Trouver un agent existant pour l'entretien
  const adminEmp = await prisma.employee.findFirst({ where: { role: 'Admin' } })
  const agentId = adminEmp ? adminEmp.id_emp : 1

  // 5. Création de l'Entretien
  const interview = await prisma.entretien.create({
    data: {
      date_heure: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // dans 2 jours
      lieu: 'Salle de réunion A / Teams',
      status: 'Planifié',
      id_cand: cand2.id_cand,
      id_application: app2.id_application,
      id_agent: agentId,
    }
  })

  // 6. Création de notifications de recrutement pour l'Admin
  if (adminEmp) {
    const dtStr = new Date(interview.date_heure).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    })
    await prisma.notification.createMany({
      data: [
        {
          recipient_id: adminEmp.id_emp,
          type: 'APPLICATION_RECEIVED',
          message: `Nouvelle candidature reçue de Sarah Benamar pour le poste de "Développeur Fullstack React & Node.js".`,
          target_model: 'Application',
          target_id: app1.id_application,
        },
        {
          recipient_id: adminEmp.id_emp,
          type: 'INTERVIEW_SCHEDULED',
          message: `Entretien programmé pour Amine Meziani (Chargé de Recrutement & RH) le ${dtStr}.`,
          target_model: 'Entretien',
          target_id: interview.id_entretien,
        },
        {
          recipient_id: adminEmp.id_emp,
          type: 'APPLICATION_ACCEPTED',
          message: `Candidature de Amine Meziani pour "Chargé de Recrutement & RH" ACCEPTÉE.`,
          target_model: 'Application',
          target_id: app2.id_application,
        }
      ]
    })
  }

  console.log('Recruitment mock data & notifications seeded successfully!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
