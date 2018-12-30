import axios from 'axios'
import { Actor, ActorMessage } from 'tarant'
import { IActor } from 'tarant/dist/actor-system/actor'
import IMaterializer from 'tarant/dist/actor-system/materializer/materializer'
import IResolver from 'tarant/dist/actor-system/resolver/resolver'

jest.useFakeTimers();

export class RemoteResolverMaterializer implements IResolver, IMaterializer {
  private resolvedActors: Set<IActor> = new Set()
  private config : any
  
  constructor(config: any) {
    this.config = config
    setInterval(() => this.updateFromBackend(), config.sync.delay)
  }

  public onInitialize(actor: Actor): void {
    //
  }

  public onBeforeMessage(actor: Actor, message: ActorMessage): void {
    //
  }

  public async onAfterMessage(actor: Actor, message: ActorMessage): Promise<void> {
    this.resolvedActors.add(actor)
    axios.post(`${this.config.paths.push}/${actor.id}`, await (actor as any).toJson())
  }

  public onError(actor: Actor, message: ActorMessage, error: any): void {
    //
  }

  public async resolveActorById(id: string): Promise<Actor> {
    const actor = await axios
      .get(`${this.config.paths.pull}/${id}`)
      .then(result => Object.assign(eval(`new ${this.config.ActorTypes[result.data.type]}("${id}")`), result.data))
    this.resolvedActors.add(actor)
    return Promise.resolve(actor)
  }

  private updateFromBackend() {
    this.resolvedActors.forEach((actor: IActor) =>
      axios.get(`${this.config.paths.pull}/${actor.id}`).then(result => (actor as any).updateFrom(result.data)),
    )
  }
}
