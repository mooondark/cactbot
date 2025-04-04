import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'AacCruiserweightM1',
  zoneId: ZoneId.AacCruiserweightM1,
  timelineFile: 'r5n.txt',
  triggers: [],
};

export default triggerSet;
