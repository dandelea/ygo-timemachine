import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
} from 'sequelize'
import { cardTypeOf, type CardType } from '../domain/card-types.ts'
import { currentImageUrl } from '../domain/images.ts'
import { sequelize } from './sequelize.ts'

// BIGINT columns come back as strings from PostgreSQL and as numbers from
// SQLite. Card ids fit safely in a JS number, so expose them consistently.
function numeric(this: Model, attribute: string): number | null {
  const value: unknown = this.getDataValue(attribute)
  return value === null || value === undefined ? null : Number(value)
}

export class Archetype extends Model<
  InferAttributes<Archetype>,
  InferCreationAttributes<Archetype>
> {
  declare id: string
}

export class Card extends Model<InferAttributes<Card>, InferCreationAttributes<Card>> {
  declare id: number
  declare name: string
  declare description: string | null
  declare type: CreationOptional<CardType | null>
  declare subtype: string | null
  declare race: string | null
  declare atk: number | null
  declare def: number | null
  declare level: number | null
  declare attribute: string | null
  declare first_release: string | null
  declare link_value: number | null
  /** Link arrows, e.g. ['Top', 'Bottom-Left']; stored as ",Top,Bottom-Left,". */
  declare link_markers: string[] | null
  declare pendulum_scale: number | null
  declare archetype_id: ForeignKey<Archetype['id']> | null
  declare images?: NonAttribute<CardImage[]>
  declare prices?: NonAttribute<CardPrice[]>
  declare archetype?: NonAttribute<Archetype | null>
}

export class CardImage extends Model<
  InferAttributes<CardImage>,
  InferCreationAttributes<CardImage>
> {
  declare id: CreationOptional<number>
  declare image: string | null
  declare image_small: string | null
  declare card_id: ForeignKey<Card['id']>
}

export class CardPrice extends Model<
  InferAttributes<CardPrice>,
  InferCreationAttributes<CardPrice>
> {
  declare id: CreationOptional<number>
  declare value: number | null
  declare shop: string
  declare date: Date
  declare card_id: ForeignKey<Card['id']>
}

export class Deck extends Model<InferAttributes<Deck>, InferCreationAttributes<Deck>> {
  declare id: CreationOptional<string>
  declare name: string
  declare color: string
  /** Format the deck is built for (`goat`, `edison`), or null for none. */
  declare format: CreationOptional<string | null>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare cards?: NonAttribute<Card[]>
  declare decks_cards?: NonAttribute<DeckCard[]>
}

export class DeckCard extends Model<InferAttributes<DeckCard>, InferCreationAttributes<DeckCard>> {
  declare id: CreationOptional<number>
  declare card_id: ForeignKey<Card['id']>
  declare deck_id: ForeignKey<Deck['id']>
  declare card?: NonAttribute<Card>
}

/** A product (booster pack, tin, promotion...) and its TCG release date. */
export class CardSet extends Model<InferAttributes<CardSet>, InferCreationAttributes<CardSet>> {
  declare name: string
  declare code: string | null
  declare release_date: string | null
}

/** One printing of a card in a set, with its code and rarity. */
export class CardPrinting extends Model<
  InferAttributes<CardPrinting>,
  InferCreationAttributes<CardPrinting>
> {
  declare id: CreationOptional<number>
  declare set_name: string | null
  declare set_code: string | null
  declare rarity: string | null
  declare card_id: ForeignKey<Card['id']>
  declare cardSet?: NonAttribute<CardSet | null>
}

/** A card that is legal in a format, with the copies the format allows (0 = forbidden). */
export class FormatCard extends Model<
  InferAttributes<FormatCard>,
  InferCreationAttributes<FormatCard>
> {
  declare id: CreationOptional<number>
  declare format: string
  declare max_copies: number
  declare card_id: ForeignKey<Card['id']>
}

// Table names match the ones created by the original JavaScript models, so
// existing databases keep working.
Archetype.init(
  { id: { type: DataTypes.STRING, allowNull: false, primaryKey: true } },
  { sequelize, tableName: 'archetypes', timestamps: false },
)

Card.init(
  {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      get() {
        return numeric.call(this, 'id')
      },
    },
    name: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.TEXT,
    type: {
      type: DataTypes.VIRTUAL(DataTypes.STRING, ['subtype']),
      get() {
        return cardTypeOf(this.getDataValue('subtype'))
      },
    },
    subtype: DataTypes.STRING,
    race: DataTypes.STRING,
    atk: DataTypes.INTEGER,
    def: DataTypes.INTEGER,
    level: DataTypes.INTEGER,
    attribute: DataTypes.STRING,
    first_release: DataTypes.DATEONLY,
    link_value: DataTypes.INTEGER,
    link_markers: {
      type: DataTypes.STRING,
      get() {
        const value = this.getDataValue('link_markers') as unknown
        return typeof value === 'string' ? value.split(',').filter(Boolean) : null
      },
      set(markers: string[] | null) {
        this.setDataValue(
          'link_markers',
          (markers?.length ? `,${markers.join(',')},` : null) as unknown as string[],
        )
      },
    },
    pendulum_scale: DataTypes.INTEGER,
    archetype_id: {
      type: DataTypes.STRING,
      references: { model: 'archetypes', key: 'id' },
      onDelete: 'SET NULL',
    },
  },
  { sequelize, tableName: 'cards', timestamps: false },
)

CardImage.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    image: {
      type: DataTypes.STRING,
      get() {
        return currentImageUrl(this.getDataValue('image'), 'large')
      },
    },
    image_small: {
      type: DataTypes.STRING,
      get() {
        return currentImageUrl(this.getDataValue('image_small'), 'small')
      },
    },
    card_id: {
      type: DataTypes.BIGINT,
      references: { model: 'cards', key: 'id' },
      onDelete: 'CASCADE',
      get() {
        return numeric.call(this, 'card_id')
      },
    },
  },
  { sequelize, tableName: 'cards_images', timestamps: false },
)

CardPrice.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    value: DataTypes.FLOAT,
    shop: DataTypes.STRING,
    date: DataTypes.DATE,
    card_id: {
      type: DataTypes.BIGINT,
      references: { model: 'cards', key: 'id' },
      onDelete: 'CASCADE',
    },
  },
  { sequelize, tableName: 'cards_prices', timestamps: false },
)

Deck.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    color: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    format: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'decks' },
)

const cardIdColumn = {
  type: DataTypes.BIGINT,
  references: { model: 'cards', key: 'id' },
  onDelete: 'CASCADE',
  get(this: Model) {
    return numeric.call(this, 'card_id')
  },
}

CardSet.init(
  {
    name: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
    code: DataTypes.STRING,
    release_date: DataTypes.DATEONLY,
  },
  { sequelize, tableName: 'sets', timestamps: false },
)

CardPrinting.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    set_name: DataTypes.STRING,
    set_code: DataTypes.STRING,
    rarity: DataTypes.STRING,
    card_id: cardIdColumn,
  },
  {
    sequelize,
    tableName: 'cards_printings',
    timestamps: false,
    indexes: [{ name: 'cards_printings_card_id', fields: ['card_id'] }],
  },
)

FormatCard.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    format: { type: DataTypes.STRING, allowNull: false },
    max_copies: { type: DataTypes.INTEGER, allowNull: false },
    card_id: cardIdColumn,
  },
  {
    sequelize,
    tableName: 'formats_cards',
    timestamps: false,
    indexes: [{ name: 'formats_cards_format_card_id', fields: ['format', 'card_id'] }],
  },
)

DeckCard.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    card_id: {
      type: DataTypes.BIGINT,
      references: { model: 'cards', key: 'id' },
      onDelete: 'CASCADE',
      get() {
        return numeric.call(this, 'card_id')
      },
    },
    deck_id: {
      type: DataTypes.UUID,
      references: { model: 'decks', key: 'id' },
      onDelete: 'CASCADE',
    },
  },
  { sequelize, tableName: 'decks_cards', timestamps: false },
)

Card.belongsTo(Archetype, { as: 'archetype', foreignKey: 'archetype_id' })
Archetype.hasMany(Card, { as: 'cards', foreignKey: 'archetype_id' })

CardImage.belongsTo(Card, { as: 'card', foreignKey: 'card_id' })
Card.hasMany(CardImage, { as: 'images', foreignKey: 'card_id' })

CardPrice.belongsTo(Card, { as: 'card', foreignKey: 'card_id' })
Card.hasMany(CardPrice, { as: 'prices', foreignKey: 'card_id' })

// A deck may contain up to three copies of a card, so the join table has its
// own id instead of a (deck_id, card_id) primary key.
Card.belongsToMany(Deck, {
  as: 'decks',
  through: { model: DeckCard, unique: false },
  foreignKey: 'card_id',
  otherKey: 'deck_id',
})
Deck.belongsToMany(Card, {
  as: 'cards',
  through: { model: DeckCard, unique: false },
  foreignKey: 'deck_id',
  otherKey: 'card_id',
})
DeckCard.belongsTo(Card, { as: 'card', foreignKey: 'card_id' })
Card.hasMany(DeckCard, { as: 'decks_cards', foreignKey: 'card_id' })
DeckCard.belongsTo(Deck, { as: 'deck', foreignKey: 'deck_id' })
Deck.hasMany(DeckCard, { as: 'decks_cards', foreignKey: 'deck_id' })

CardPrinting.belongsTo(Card, { as: 'card', foreignKey: 'card_id' })
Card.hasMany(CardPrinting, { as: 'printings', foreignKey: 'card_id' })
// Printings of sets missing from the set list keep their name, so no constraint.
CardPrinting.belongsTo(CardSet, { as: 'cardSet', foreignKey: 'set_name', constraints: false })

FormatCard.belongsTo(Card, { as: 'card', foreignKey: 'card_id' })
Card.hasMany(FormatCard, { as: 'formats', foreignKey: 'card_id' })
