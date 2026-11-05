import type { Anmeldungen, Events } from './app';

export type EnrichedEvents = Events & {
  ortName: string;
};

export type EnrichedAnmeldungen = Anmeldungen & {
  eventName: string;
  teilnehmerName: string;
};
