import {z} from 'zod';
import type {Good} from '../../game-core/src/content';

// These three authored equipment cards are inventory tokens with exact implemented uses.
// This is not the proposed fifteen-family playable deck catalogue.
export const EquipmentCardSchema=z.object({
 id:z.string().regex(/^equipment-/),family:z.literal('Equipment'),good:z.enum(['medical','communications','vehicles']),
 name:z.object({en:z.string(),da:z.string()}),description:z.object({en:z.string(),da:z.string()}),
 timing:z.literal('actions-or-negotiation'),icon:z.string(),art:z.literal('equipment-triptych'),
 print:z.object({widthMm:z.literal(63),heightMm:z.literal(88),bleedMm:z.literal(3),safeMm:z.literal(5)}),
}).strict();
export type EquipmentCard= z.infer<typeof EquipmentCardSchema>;
const print={widthMm:63,heightMm:88,bleedMm:3,safeMm:5} as const;
export const equipmentCards:Record<Good,EquipmentCard>={
 medical:EquipmentCardSchema.parse({id:'equipment-infantry-01',family:'Equipment',good:'medical',name:{en:'Infantry equipment',da:'Infanteriudstyr'},description:{en:'One abstract infantry equipment cargo token. No operational specifications.',da:'Én abstrakt lastenhed med infanteriudstyr. Ingen operationelle specifikationer.'},timing:'actions-or-negotiation',icon:'supply',art:'equipment-triptych',print}),
 communications:EquipmentCardSchema.parse({id:'equipment-communications-01',family:'Equipment',good:'communications',name:{en:'Communications',da:'Kommunikation'},description:{en:'One abstract communications equipment cargo token.',da:'Én abstrakt lastenhed med kommunikationsudstyr.'},timing:'actions-or-negotiation',icon:'communications',art:'equipment-triptych',print}),
 vehicles:EquipmentCardSchema.parse({id:'equipment-mobility-01',family:'Equipment',good:'vehicles',name:{en:'Armored mobility',da:'Pansret mobilitet'},description:{en:'One abstract armored mobility cargo token.',da:'Én abstrakt lastenhed med pansret mobilitet.'},timing:'actions-or-negotiation',icon:'vehicles',art:'equipment-triptych',print}),
};
