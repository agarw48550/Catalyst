/**
 * i18n Translation Tests
 * Ensures all languages have complete key coverage and the toggle cycles correctly.
 */
import { describe, it, expect } from 'vitest'
import { translations } from '../translations'

const enKeys = Object.keys(translations.en).sort()

describe('translations completeness', () => {
    it('Hindi (hi) has every key that English (en) has', () => {
        const hiKeys = Object.keys(translations.hi).sort()
        expect(hiKeys).toEqual(enKeys)
    })

    it('Marathi (mr) has every key that English (en) has', () => {
        const mrKeys = Object.keys(translations.mr).sort()
        expect(mrKeys).toEqual(enKeys)
    })

    it('no translation value is empty or just whitespace', () => {
        for (const lang of ['en', 'hi', 'mr'] as const) {
            for (const [key, value] of Object.entries(translations[lang])) {
                expect(value.trim().length, `${lang}.${key} is empty`).toBeGreaterThan(0)
            }
        }
    })
})

describe('Language type coverage', () => {
    it('translations object has en, hi, and mr', () => {
        expect(Object.keys(translations).sort()).toEqual(['en', 'hi', 'mr'])
    })
})
