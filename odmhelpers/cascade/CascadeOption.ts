/**
 * Cascade options used to set cascade operations over document relations.
 */
export interface CascadeOption {

    insert?: boolean;
    update?: boolean;
    remove?: boolean;
    field: string|any;
    cascades?: CascadeOption[]|((object: any) => CascadeOption[]);
}

/**
 * Cascade options can be set using multiple forms:
 *
 * Form1: nested fields
 *
 * let cascades = {
 *     answers: {
 *         insert: true,
 *         update: true,
 *         remove: true,
 *         cascades: {
 *             name: {
 *                 insert: true,
 *                 update: true,
 *                 remove: true
 *             }
 *             // ...
 *         }
 *     }
 *     // ...
 * };
 *
 * Form2: flat fields
 *
 * let cascades = {
 *      'answers': { insert: true, update: true, remove: true },
 *      'answers.name': { insert: true, update: true, remove: true },
 *      // ...
 * };
 *
 * Form3: field in CascadeOption object
 *
 * let cascades2 = {
 *      'answers': { insert: true, update: true, remove: true },
 *      'answers.name': { insert: true, update: true, remove: true },
 *      // ...
 * };
 *
 * Form4: typesafe using typed objects in function arguments
 *
 * let cascades3 = (vote: Vote) => [{
 *      field: vote.answers,
 *      insert: true,
 *      update: true,
 *      remove: true,
 *      cascades: (voteAnswer: VoteAnswer) => [{
 *          field: voteAnswer.results,
 *          insert: true,
 *          update: true,
 *          remove: true
 *      }]
 * }];
 *
 */
export type DynamicCascadeOptions<Entity> = CascadeOption[]|((entity: Entity) => CascadeOption[])|Object;