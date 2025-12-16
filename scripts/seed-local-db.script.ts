import { db, pool } from '../server/db/db'
import * as schema from '../server/db/schema'
import { seed } from 'drizzle-seed'

const seedDb = async () => {
  await seed(db, schema).refine((funcs) => ({
    todos: {
      columns: {
        title: funcs.valuesFromArray({
          values: ['Buy groceries', 'Walk the dog', 'Read a book', 'Write code', 'Exercise', 'Cook dinner', 'Clean the house', 'Pay bills', 'Call a friend', 'Plan a trip'],
        }),
        description: funcs.valuesFromArray({
          values: [
            'Remember to buy milk, eggs, and bread.',
            'Take Fido for a 30-minute walk in the park.',
            'Finish reading the latest novel by your favorite author.',
            'Work on the new feature for the project.',
            'Go for a 5km run around the neighborhood.',
            undefined
          ],
        })
      }
    }
  }))
}

seedDb()
  .then(() => {
    console.log('Database seeded successfully')
    return pool.end()
  })
  .catch((error) => {
    console.error('Error seeding database:', error)
    return pool.end()
  })
