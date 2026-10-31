// Built-in templates that live in code rather than templates/ (the AI one follows the synced model catalog).
import type {Board, Credit, TemplateBoard} from './board.ts';
import {fromCatalog, initialState, replaceContestants} from './board.ts';
import {flagships, models} from './catalog.ts';
import {AI_TEMPLATE_ID, TOY_AUTHOR} from './constants.ts';
import {templateIdSchema} from './ids.ts';

export const AI_TITLE = '2026 AI 大模型排位';
export const aiCredit: Credit = {template: templateIdSchema.parse(AI_TEMPLATE_ID), author: TOY_AUTHOR.name, bilibili: TOY_AUTHOR.bilibili};

/** First-visit board: the AI flagship template, credited to the Toy author. */
export const starterBoard = (): Board => ({...initialState(models), credit: aiCredit});

/** The AI template applied to a board: current tiers, flagship models, author credit. */
export const aiTemplate = (board: Board): TemplateBoard => ({...replaceContestants({board, title: AI_TITLE, pool: flagships.map(fromCatalog)}), credit: aiCredit});
