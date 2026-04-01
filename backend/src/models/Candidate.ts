import mongoose, { Schema, Document, Query } from 'mongoose';

/**
 * Interface TypeScript pour le modèle Candidate
 */
export interface ICandidate extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  skills: string[];
  experience: number;
  education: string;
  birthDate?: Date;
  resume?: string;
  resumeUrl?: string;
  status: 'pending' | 'reviewing' | 'validated' | 'rejected' | 'archived';
  notes?: string;
  validatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  isDeleted: boolean;
}

/**
 * Schéma Mongoose pour les candidats
 */
const CandidateSchema: Schema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Le prénom est requis'],
      trim: true,
      maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères'],
    },
    lastName: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères'],
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez fournir un email valide'],
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
        'Veuillez fournir un numéro de téléphone valide',
      ],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, "L'adresse ne peut pas dépasser 200 caractères"],
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'La ville ne peut pas dépasser 100 caractères'],
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Le pays ne peut pas dépasser 100 caractères'],
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: [20, 'Le code postal ne peut pas dépasser 20 caractères'],
    },
    skills: {
      type: [String],
      default: [],
      validate: {
        validator: function (skills: string[]) {
          return skills.length <= 20;
        },
        message: 'Un candidat ne peut pas avoir plus de 20 compétences',
      },
    },
    experience: {
      type: Number,
      default: 0,
      min: [0, "L'expérience ne peut pas être négative"],
      max: [50, "L'expérience ne peut pas dépasser 50 ans"],
    },
    education: {
      type: String,
      enum: {
        values: ['high_school', 'bachelor', 'master', 'phd', 'other'],
        message: "Niveau d'éducation non valide",
      },
      default: 'other',
    },
    birthDate: {
      type: Date,
    },
    resume: {
      type: String,
      trim: true,
    },
    resumeUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'reviewing', 'validated', 'rejected', 'archived'],
        message: 'Statut non valide',
      },
      default: 'pending',
    },
    notes: {
      type: String,
      maxlength: [1000, 'Les notes ne peuvent pas dépasser 1000 caractères'],
    },
    validatedAt: {
      type: Date,
    },
    deletedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index pour la recherche
CandidateSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });
CandidateSchema.index({ status: 1 });
CandidateSchema.index({ isDeleted: 1 });

// Middleware pour exclure les documents supprimés par défaut
CandidateSchema.pre(/^find/, function (this: Query<any, ICandidate>, next) {
  const query = this.getQuery() as { isDeleted?: boolean };
  if (query.isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

// Virtual pour le nom complet
CandidateSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export default mongoose.model<ICandidate>('Candidate', CandidateSchema);
