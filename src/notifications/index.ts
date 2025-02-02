import { createApp } from 'vue'
import * as Croquet from '@croquet/croquet'
import { BikeTagEvent, BikeTagEventPayload } from '@/common/types'
import { getBikeTagHash } from '@/common/utils'

let instace: any

export const getInstance = () => instace

export const croquetSession = (app: any) => {
  if (instace) {
    console.log('notifications::existing instance provided')
    return instace
  }

  class BikeTagNotificationsModel extends Croquet.Model {
    init() {
      for (const value in BikeTagEvent) {
        this.subscribe('notification', value, this.pubNotification)
      }
    }

    pubNotification(payload: BikeTagEventPayload) {
      if (
        app.config.globalProperties.$store.getters.getProfile?.user_metadata?.name !== payload.from
      ) {
        app.config.globalProperties.$toast.success(payload.msg, {
          position: 'top',
        })
      }
    }
  }

  BikeTagNotificationsModel.register('BikeTagNotificationsModel')
  console.log('notifications::BikeTagNotificationsModel registered')
  class BikeTagNotificationsView extends Croquet.View {
    model: BikeTagNotificationsModel
    constructor(model: BikeTagNotificationsModel) {
      super(model)
      this.model = model
    }

    send(payload: BikeTagEventPayload) {
      this.publish('notification', 'foundTag', payload)
    }
  }

  instace = createApp({
    data() {
      return {
        session: null,
      }
    },
    async created() {
      this.session = await Croquet.Session.join({
        apiKey: process.env.C_AKEY ?? '',
        appId: process.env.HOST_KEY ?? '',
        name: process.env.C_SNAME ?? 'biketag',
        password: process.env.C_SPASS ?? 'secret',
        model: BikeTagNotificationsModel,
        view: BikeTagNotificationsView,
      })
    },
    methods: {
      send(payload: any) {
        this.session?.view.send(payload) //error
      },
    },
  }).mount(document.createElement('div'))

  return instace
}

export const NotificationsPlugin = {
  install(app: any) {
    app.config.globalProperties.$notifications = croquetSession(app)
  },
}

export const createSession = async (app: any) => {
  const time = new Date().toUTCString()
  class BikeTagNotificationsModel extends Croquet.Model {
    startTime: string = time
    idRecord: string[] = []

    init() {
      this.subscribe('notification', BikeTagEvent.addFoundTag, this.pubNotification)
      this.subscribe('notification', BikeTagEvent.addMysteryTag, this.pubNotification)
      this.subscribe('notification', BikeTagEvent.approveTag, this.approveTagNotification)
      this.subscribe('notification', BikeTagEvent.dequeueTag, this.dequeueTagNotification)
    }

    recordId(payload: BikeTagEventPayload) {
      if (this.idRecord.includes(payload.id)) {
        return false
      } else {
        this.idRecord.push(payload.id)
        return true
      }
    }

    getPayloadData(payload: BikeTagEventPayload) {
      return {
        playerId: app.config.globalProperties.$store.getters.getProfile?.sub,
        timeRegion:
          new Date(payload.created) > new Date(this.startTime) &&
          payload.region === app.config.globalProperties.$store.getters.getGame?.region?.name,
        isRecorded: this.recordId(payload),
      }
    }

    showToast(msg: string, type = 'success') {
      app.config.globalProperties.$toast[type](msg, {
        position: 'bottom',
        duration: 5000,
      })
    }

    pubNotification(payload: BikeTagEventPayload) {
      const { playerId, timeRegion, isRecorded } = this.getPayloadData(payload)
      if (playerId !== payload.from && timeRegion && isRecorded) {
        this.showToast(payload.msg)
      }
    }

    approveTagNotification(payload: BikeTagEventPayload) {
      const { playerId, timeRegion, isRecorded } = this.getPayloadData(payload)
      if (isRecorded && timeRegion) {
        if (playerId === payload.to) {
          this.showToast('Your tag has been approved.')
        } else if (playerId !== payload.from) {
          this.showToast(payload.msg)
        }
      }
    }

    dequeueTagNotification(payload: BikeTagEventPayload) {
      const { playerId, timeRegion, isRecorded } = this.getPayloadData(payload)
      if (playerId === payload.to && timeRegion && isRecorded) {
        this.showToast('Your tag has been removed.', 'error')
      }
    }
  }

  BikeTagNotificationsModel.register('BikeTagNotificationsModel')
  class BikeTagNotificationsView extends Croquet.View {
    model: BikeTagNotificationsModel
    constructor(model: BikeTagNotificationsModel) {
      super(model)
      this.model = model
    }

    send(payload: BikeTagEventPayload) {
      this.publish('notification', payload.type, payload)
    }
  }

  class NotificationsPlugin {
    session: Croquet.CroquetSession<BikeTagNotificationsView>
    constructor(session: Croquet.CroquetSession<BikeTagNotificationsView>) {
      this.session = session
    }

    send(msg: string, storeAction: string, to = 'all') {
      if (BikeTagEvent[storeAction]) {
        this.session.view.send({
          to,
          msg,
          id: getBikeTagHash(new Date().toUTCString()),
          type: BikeTagEvent[storeAction],
          from: app.config.globalProperties.$store.getters.getProfile?.sub,
          created: new Date().toUTCString(),
          region: app.config.globalProperties.$store.getters.getGame?.region?.name,
        })
      }
    }
  }

  Croquet.App.root = false
  return new NotificationsPlugin(
    await Croquet.Session.join({
      apiKey: process.env.C_AKEY ?? '',
      appId: process.env.HOST_KEY ?? '',
      name: process.env.C_SNAME ?? 'biketag',
      password: process.env.C_SPASS ?? 'secret',
      model: BikeTagNotificationsModel,
      view: BikeTagNotificationsView,
    })
  )
}
