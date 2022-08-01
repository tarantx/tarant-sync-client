jest.useFakeTimers()
jest.spyOn(global, 'setInterval')

const mockAxios = {
  post: jest.fn(),
  get: jest.fn(),
}
jest.mock('axios', () => ({ __esModule: true, default: mockAxios }))

import { RemoteResolverMaterializer } from '../lib/RemoteResolverMaterializer'
import { faker } from '@faker-js/faker'
import { Actor, ActorMessage } from 'tarant'

class FakeActor {
  constructor(id: string) {
    this.id = id
  }
  readonly id: string
  toJson() {}
  updateFrom() {}
}

describe('RemoteResolverMaterializer', () => {
  beforeEach(() => {
    mockAxios.post.mockReset()
    mockAxios.get.mockReset()
  })

  describe('as a Resolver', () => {
    it('should try retrieve actor from remote', async () => {
      const id = faker.datatype.uuid(),
        config = {
          sync: {
            active: true,
            delay: faker.datatype.number(1000),
          },
          paths: {
            pull: faker.internet.url(),
            push: faker.internet.url(),
          },
          actorTypes: { FakeActor },
        },
        expectToJson = {
          data: {
            type: 'FakeActor',
            random: faker.datatype.uuid(),
          },
        }
      mockAxios.get.mockResolvedValue(expectToJson)

      let local = new RemoteResolverMaterializer(config)
      let result = await local.resolveActorById(id)
      expect(mockAxios.get).toHaveBeenCalledWith(`${config.paths.pull}/${id}`)
      expect(result).toBeDefined()
    })
  })

  describe('live sync', () => {
    it('should sync actors that are in both sides if it was added by resolver', async () => {
      const id = faker.datatype.uuid(),
        config = {
          sync: {
            active: true,
            delay: faker.datatype.number(1000),
          },
          paths: {
            pull: faker.internet.url(),
            push: faker.internet.url(),
          },
          actorTypes: { FakeActor },
        },
        expectToJson = {
          data: {
            type: 'FakeActor',
            random: faker.datatype.uuid(),
            id,
          },
        }
      mockAxios.get.mockResolvedValue(expectToJson)

      let local = new RemoteResolverMaterializer(config)

      await local.resolveActorById(id)

      mockAxios.get.mockClear()
      jest.advanceTimersByTime(config.sync.delay)

      expect(mockAxios.get).toHaveBeenCalledWith(`${config.paths.pull}/${id}`)
      expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), config.sync.delay)
    })

    it('should sync actors that are in both sides if it was added by materializer', async () => {
      const id = faker.datatype.uuid(),
        config = {
          sync: {
            active: true,
            delay: faker.datatype.number(1000),
          },
          paths: {
            pull: faker.internet.url(),
            push: faker.internet.url(),
          },
          actorTypes: { FakeActor },
        },
        expectToJson = {
          data: {
            type: 'FakeActor',
            random: faker.datatype.uuid(),
            id,
          },
        },
        actor = jest.fn<Actor, []>(
          () =>
            ({
              id,
              toJson: () => Promise.resolve(expectToJson),
              updateFrom: jest.fn(),
            } as any),
        )(),
        actorMessage = jest.fn<ActorMessage, []>()()

      mockAxios.get.mockResolvedValue(expectToJson)

      let local = new RemoteResolverMaterializer(config)

      await local.onAfterMessage(actor, actorMessage)

      mockAxios.get.mockClear()

      jest.advanceTimersByTime(config.sync.delay + 10)

      expect(mockAxios.get).toHaveBeenCalledWith(`${config.paths.pull}/${id}`)
      expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), config.sync.delay)
    })
  })

  describe('as a Materializer', () => {
    it('should send message if actor is updated', async () => {
      const id = faker.datatype.uuid(),
        config = {
          sync: {
            active: true,
            delay: faker.datatype.number(1000),
          },
          paths: {
            pull: faker.internet.url(),
            push: faker.internet.url(),
          },
        },
        expectToJson = { random: faker.datatype.uuid() },
        actor = jest.fn<Actor, []>(
          () =>
            ({
              id,
              toJson: () => Promise.resolve(expectToJson),
              updateFrom: jest.fn(),
            } as any),
        )(),
        actorMessage = jest.fn<ActorMessage, []>()()
      let local = new RemoteResolverMaterializer(config)
      await local.onAfterMessage(actor, actorMessage)
      expect(mockAxios.post).toHaveBeenCalledWith(`${config.paths.push}/${id}`, expectToJson)
    })
  })
})
