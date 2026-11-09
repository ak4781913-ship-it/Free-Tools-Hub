import React from 'react';
import { ResumeData } from '../../../types/resume';
import { Mail, Phone, MapPin, Globe, Linkedin, Github } from 'lucide-react';

interface ResumePreviewProps {
  data: ResumeData;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ data }) => {
  const { personalInfo, experience, education, skills, languages, certifications, projects, sectionVisibility, designSettings } = data;
  const { template, accentColor, fontFamily, fontSize } = designSettings;

  const fontClass =
    fontFamily === 'serif'
      ? 'font-serif'
      : fontFamily === 'mono'
      ? 'font-mono'
      : 'font-sans';

  const sizeClass =
    fontSize === 'compact'
      ? 'text-[11px] leading-snug'
      : fontSize === 'relaxed'
      ? 'text-[13px] leading-relaxed'
      : 'text-[12px] leading-normal';

  return (
    <div
      id="printable-resume-area"
      className={`w-full max-w-[800px] mx-auto bg-white text-slate-900 p-4 sm:p-8 md:p-10 overflow-x-auto break-words shadow-lg rounded-sm transition-all border border-slate-200 print:border-none print:shadow-none print:p-0 ${fontClass} ${sizeClass}`}
      style={{ minHeight: '1050px' }}
    >
      {/* TEMPLATE 1: MODERN */}
      {template === 'modern' && (
        <div className="space-y-6">
          {/* Header */}
          <div
            className="pb-5 border-b-2"
            style={{ borderColor: accentColor }}
          >
            <div className={`flex flex-col sm:flex-row items-start justify-between gap-4 ${
              personalInfo.photoPosition === 'left' ? 'sm:flex-row-reverse sm:justify-end sm:gap-6' : ''
            }`}>
              <div className="flex-1 min-w-0">
                <div role="heading" aria-level={2} className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: accentColor }}>
                  {personalInfo.fullName || 'Your Full Name'}
                </div>
                <p className="text-sm sm:text-base font-medium text-slate-700 mt-1">
                  {personalInfo.jobTitle || 'Professional Job Title'}
                </p>

                {/* Contact details */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[11px] text-slate-600">
                  {personalInfo.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {personalInfo.email}
                    </span>
                  )}
                  {personalInfo.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {personalInfo.phone}
                    </span>
                  )}
                  {(personalInfo.city || personalInfo.country) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {[personalInfo.city, personalInfo.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {personalInfo.linkedinUrl && (
                    <span className="flex items-center gap-1">
                      <Linkedin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {personalInfo.linkedinUrl}
                    </span>
                  )}
                  {personalInfo.portfolioUrl && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {personalInfo.portfolioUrl}
                    </span>
                  )}
                  {personalInfo.githubUrl && (
                    <span className="flex items-center gap-1">
                      <Github className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {personalInfo.githubUrl}
                    </span>
                  )}
                </div>
              </div>

              {/* Profile Photo in Modern Template */}
              {personalInfo.photo && (
                <div className="shrink-0 self-center sm:self-start">
                  <div
                    className={`w-24 h-24 sm:w-28 sm:h-28 overflow-hidden shadow-md border-2 border-white ring-2 ring-slate-200/80 ${
                      personalInfo.photoShape === 'square' ? 'rounded-2xl' : 'rounded-full'
                    }`}
                  >
                    <img
                      src={personalInfo.photo}
                      alt={personalInfo.fullName || 'Candidate Photo'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            {personalInfo.summary && (
              <p className="mt-3 text-slate-600 leading-relaxed text-[11.5px]">
                {personalInfo.summary}
              </p>
            )}
          </div>

          {/* Experience */}
          {sectionVisibility.experience && experience.length > 0 && (
            <div className="space-y-4">
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 border-b"
                style={{ color: accentColor, borderColor: `${accentColor}33` }}
              >
                Work Experience
              </h2>
              <div className="space-y-4">
                {experience.map((exp) => (
                  <div key={exp.id} className="space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {exp.jobTitle}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
                      <span>{exp.company}</span>
                      {exp.location && <span className="text-slate-500 text-[11px]">{exp.location}</span>}
                    </div>
                    {exp.highlights.length > 0 && (
                      <ul className="list-disc pl-4 space-y-1 text-slate-600 pt-1 text-[11.5px]">
                        {exp.highlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {sectionVisibility.education && education.length > 0 && (
            <div className="space-y-3">
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 border-b"
                style={{ color: accentColor, borderColor: `${accentColor}33` }}
              >
                Education & Credentials
              </h2>
              <div className="space-y-3">
                {education.map((edu) => (
                  <div key={edu.id} className="space-y-0.5">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {edu.degree}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {edu.startDate} – {edu.current ? 'Present' : edu.endDate}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700">
                      {edu.institution} {edu.location ? `· ${edu.location}` : ''}
                    </div>
                    {edu.scoreOrGrade && (
                      <div className="text-[11px] text-slate-600 font-medium">
                        Grade: {edu.scoreOrGrade}
                      </div>
                    )}
                    {edu.description && (
                      <div className="text-[11px] text-slate-500">{edu.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills & Languages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {sectionVisibility.skills && skills.length > 0 && (
              <div className="space-y-2">
                <h2
                  className="text-xs font-bold uppercase tracking-wider pb-1 border-b"
                  style={{ color: accentColor, borderColor: `${accentColor}33` }}
                >
                  Core Skills
                </h2>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skills.map((sk) => (
                    <span
                      key={sk.id}
                      className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[11px] font-medium"
                    >
                      {sk.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {sectionVisibility.languages && languages.length > 0 && (
              <div className="space-y-2">
                <h2
                  className="text-xs font-bold uppercase tracking-wider pb-1 border-b"
                  style={{ color: accentColor, borderColor: `${accentColor}33` }}
                >
                  Languages
                </h2>
                <div className="space-y-1 pt-1 text-xs text-slate-700">
                  {languages.map((lang) => (
                    <div key={lang.id} className="flex justify-between">
                      <span className="font-medium">{lang.language}</span>
                      <span className="text-slate-500 text-[11px]">{lang.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Projects */}
          {sectionVisibility.projects && projects.length > 0 && (
            <div className="space-y-3">
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 border-b"
                style={{ color: accentColor, borderColor: `${accentColor}33` }}
              >
                Key Projects
              </h2>
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div key={proj.id} className="space-y-0.5">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {proj.title}
                      </span>
                      {proj.link && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          {proj.link}
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-slate-600">{proj.description}</p>
                    {proj.technologies && (
                      <p className="text-[10.5px] text-slate-500 font-medium">
                        Technologies: {proj.technologies}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {sectionVisibility.certifications && certifications.length > 0 && (
            <div className="space-y-2">
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 border-b"
                style={{ color: accentColor, borderColor: `${accentColor}33` }}
              >
                Certifications
              </h2>
              <div className="space-y-1.5 text-xs text-slate-700">
                {certifications.map((cert) => (
                  <div key={cert.id} className="flex justify-between">
                    <span className="font-medium">{cert.name} — {cert.issuer}</span>
                    <span className="text-slate-500 font-mono text-[11px]">{cert.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TEMPLATE 2: CLASSIC */}
      {template === 'classic' && (
        <div className="space-y-6">
          <div className="pb-4 border-b border-slate-300">
            <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${
              personalInfo.photoPosition === 'left' ? 'sm:flex-row' : 'sm:flex-row-reverse'
            }`}>
              {/* Profile Photo in Classic Template */}
              {personalInfo.photo && (
                <div className="shrink-0">
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 overflow-hidden shadow-sm border border-slate-300 ring-2 ring-slate-100 ${
                      personalInfo.photoShape === 'square' ? 'rounded-xl' : 'rounded-full'
                    }`}
                  >
                    <img
                      src={personalInfo.photo}
                      alt={personalInfo.fullName || 'Candidate Photo'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="text-center flex-1 min-w-0">
                <div role="heading" aria-level={2} className="text-2xl font-bold tracking-tight text-slate-900">
                  {personalInfo.fullName || 'Your Full Name'}
                </div>
                <p className="text-sm text-slate-700 font-medium mt-1">
                  {personalInfo.jobTitle || 'Professional Job Title'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-600">
                  {personalInfo.email && <span>{personalInfo.email}</span>}
                  {personalInfo.phone && <span>· {personalInfo.phone}</span>}
                  {(personalInfo.city || personalInfo.country) && (
                    <span>· {[personalInfo.city, personalInfo.country].filter(Boolean).join(', ')}</span>
                  )}
                  {personalInfo.linkedinUrl && <span>· {personalInfo.linkedinUrl}</span>}
                  {personalInfo.portfolioUrl && <span>· {personalInfo.portfolioUrl}</span>}
                  {personalInfo.githubUrl && <span>· {personalInfo.githubUrl}</span>}
                </div>
              </div>
            </div>

            {personalInfo.summary && (
              <p className="mt-3 text-slate-600 max-w-xl mx-auto text-[11.5px] leading-relaxed italic text-center">
                "{personalInfo.summary}"
              </p>
            )}
          </div>

          {/* Classic Experience */}
          {sectionVisibility.experience && experience.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 pb-1 border-b border-slate-300">
                Professional Experience
              </h2>
              <div className="space-y-3">
                {experience.map((exp) => (
                  <div key={exp.id} className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900">{exp.company}</span>
                      <span className="text-[11px] font-mono text-slate-600">
                        {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 italic">
                      {exp.jobTitle} {exp.location ? `| ${exp.location}` : ''}
                    </div>
                    {exp.highlights.length > 0 && (
                      <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11.5px]">
                        {exp.highlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Classic Education */}
          {sectionVisibility.education && education.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 pb-1 border-b border-slate-300">
                Education
              </h2>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-baseline text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{edu.degree}</span>
                      <span className="text-slate-600">, {edu.institution}</span>
                    </div>
                    <span className="font-mono text-slate-500 text-[11px]">
                      {edu.startDate} – {edu.endDate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Classic Skills */}
          {sectionVisibility.skills && skills.length > 0 && (
            <div className="space-y-1.5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 pb-1 border-b border-slate-300">
                Key Competencies
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed">
                {skills.map((s) => s.name).join(' · ')}
              </p>
            </div>
          )}
          {/* Classic Projects */}
          {sectionVisibility.projects && projects.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 pb-1 border-b border-slate-300">
                Key Projects
              </h2>
              <div className="space-y-2.5">
                {projects.map((proj) => (
                  <div key={proj.id} className="space-y-0.5">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-bold text-slate-900">{proj.title}</span>
                      {proj.link && <span className="font-mono text-slate-500 text-[11px]">{proj.link}</span>}
                    </div>
                    {proj.description && <p className="text-[11.5px] text-slate-600">{proj.description}</p>}
                    {proj.technologies && (
                      <p className="text-[10.5px] text-slate-500 italic">Technologies: {proj.technologies}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Classic Certifications & Languages */}
          {((sectionVisibility.certifications && certifications.length > 0) ||
            (sectionVisibility.languages && languages.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {sectionVisibility.certifications && certifications.length > 0 && (
                <div className="space-y-1.5">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 pb-1 border-b border-slate-300">
                    Certifications
                  </h2>
                  <div className="space-y-1 text-xs text-slate-700">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="flex justify-between gap-2">
                        <span>{cert.name}{cert.issuer ? ` — ${cert.issuer}` : ''}</span>
                        <span className="font-mono text-slate-500 text-[11px]">{cert.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sectionVisibility.languages && languages.length > 0 && (
                <div className="space-y-1.5">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 pb-1 border-b border-slate-300">
                    Languages
                  </h2>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {languages.map((l) => `${l.language} (${l.proficiency})`).join(' · ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TEMPLATE 3: MINIMAL */}
      {template === 'minimal' && (
        <div className="space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <div className={`flex flex-col sm:flex-row items-start justify-between gap-4 ${
              personalInfo.photoPosition === 'left' ? 'sm:flex-row-reverse sm:justify-end sm:gap-6' : ''
            }`}>
              <div className="flex-1 min-w-0">
                <div role="heading" aria-level={2} className="text-2xl font-light tracking-tight text-slate-900">
                  {personalInfo.fullName || 'Your Full Name'}
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
                  {personalInfo.jobTitle || 'Professional Job Title'}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500 font-mono">
                  {personalInfo.email && <span>{personalInfo.email}</span>}
                  {personalInfo.phone && <span>{personalInfo.phone}</span>}
                  {(personalInfo.city || personalInfo.country) && (
                    <span>{[personalInfo.city, personalInfo.country].filter(Boolean).join(', ')}</span>
                  )}
                  {personalInfo.linkedinUrl && <span>{personalInfo.linkedinUrl}</span>}
                </div>
              </div>

              {personalInfo.photo && (
                <div className="shrink-0">
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 overflow-hidden border border-slate-200 transition-all ${
                      personalInfo.photoShape === 'square' ? 'rounded-lg' : 'rounded-full'
                    }`}
                  >
                    <img
                      src={personalInfo.photo}
                      alt={personalInfo.fullName || 'Candidate Photo'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {personalInfo.summary && (
              <p className="mt-3 text-xs text-slate-600 leading-relaxed max-w-2xl">
                {personalInfo.summary}
              </p>
            )}
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-5">
            {sectionVisibility.experience && experience.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Experience
                </span>
                <div className="sm:col-span-3 space-y-4">
                  {experience.map((exp) => (
                    <div key={exp.id} className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-slate-900 text-xs">
                          {exp.jobTitle} / {exp.company}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {exp.startDate} – {exp.current ? 'Now' : exp.endDate}
                        </span>
                      </div>
                      {exp.highlights.length > 0 && (
                        <ul className="list-disc pl-4 space-y-1 text-[11.5px] text-slate-600">
                          {exp.highlights.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sectionVisibility.education && education.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Education
                </span>
                <div className="sm:col-span-3 space-y-2">
                  {education.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-baseline text-xs">
                      <span className="text-slate-800 font-medium">
                        {edu.degree}, {edu.institution}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {edu.startDate} – {edu.endDate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sectionVisibility.skills && skills.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Skills
                </span>
                <div className="sm:col-span-3 text-xs text-slate-700">
                  {skills.map((s) => s.name).join(' / ')}
                </div>
              </div>
            )}
            {sectionVisibility.projects && projects.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Projects
                </span>
                <div className="sm:col-span-3 space-y-2.5">
                  {projects.map((proj) => (
                    <div key={proj.id} className="space-y-0.5 text-xs">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-slate-900">{proj.title}</span>
                        {proj.link && <span className="text-[11px] text-slate-400 font-mono">{proj.link}</span>}
                      </div>
                      {proj.description && <p className="text-[11.5px] text-slate-600">{proj.description}</p>}
                      {proj.technologies && <p className="text-[10.5px] text-slate-400">{proj.technologies}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sectionVisibility.certifications && certifications.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Certifications
                </span>
                <div className="sm:col-span-3 space-y-1 text-xs text-slate-700">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="flex justify-between">
                      <span>{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ''}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{cert.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sectionVisibility.languages && languages.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Languages
                </span>
                <div className="sm:col-span-3 text-xs text-slate-700">
                  {languages.map((l) => `${l.language} (${l.proficiency})`).join(' / ')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEMPLATE 4: ATS-FRIENDLY */}
      {template === 'ats' && (
        <div className="space-y-5 font-sans">
          <div className="text-left border-b border-black pb-3">
            <div className={`flex flex-col sm:flex-row items-start justify-between gap-4 ${
              personalInfo.photoPosition === 'left' ? 'sm:flex-row-reverse sm:justify-end sm:gap-4' : ''
            }`}>
              <div className="flex-1 min-w-0">
                <div role="heading" aria-level={2} className="text-2xl font-bold uppercase tracking-wider text-black">
                  {personalInfo.fullName || 'YOUR FULL NAME'}
                </div>
                <p className="text-sm font-semibold text-black mt-0.5">
                  {personalInfo.jobTitle || 'JOB TITLE'}
                </p>
                <div className="text-xs text-black mt-1.5 flex flex-wrap gap-x-3">
                  {personalInfo.email && <span>Email: {personalInfo.email}</span>}
                  {personalInfo.phone && <span>| Phone: {personalInfo.phone}</span>}
                  {(personalInfo.city || personalInfo.country) && (
                    <span>| Location: {[personalInfo.city, personalInfo.country].filter(Boolean).join(', ')}</span>
                  )}
                  {personalInfo.linkedinUrl && <span>| LinkedIn: {personalInfo.linkedinUrl}</span>}
                </div>
              </div>

              {personalInfo.photo && personalInfo.showPhotoInAts && (
                <div className="shrink-0">
                  <div
                    className={`w-20 h-20 overflow-hidden border border-black ${
                      personalInfo.photoShape === 'square' ? 'rounded-none' : 'rounded-full'
                    }`}
                  >
                    <img
                      src={personalInfo.photo}
                      alt={personalInfo.fullName || 'Candidate Photo'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {personalInfo.summary && (
            <div className="space-y-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
                Professional Summary
              </h2>
              <p className="text-xs text-black leading-relaxed">{personalInfo.summary}</p>
            </div>
          )}

          {sectionVisibility.experience && experience.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
                Work Experience
              </h2>
              <div className="space-y-3">
                {experience.map((exp) => (
                  <div key={exp.id} className="space-y-1">
                    <div className="flex justify-between font-bold text-xs text-black">
                      <span>{exp.jobTitle} — {exp.company}</span>
                      <span>{exp.startDate} to {exp.current ? 'Present' : exp.endDate}</span>
                    </div>
                    {exp.highlights.length > 0 && (
                      <ul className="list-disc pl-5 space-y-0.5 text-xs text-black">
                        {exp.highlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {sectionVisibility.education && education.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
                Education
              </h2>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="flex justify-between text-xs text-black">
                    <span><strong>{edu.degree}</strong>, {edu.institution}</span>
                    <span>{edu.startDate} – {edu.endDate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sectionVisibility.skills && skills.length > 0 && (
            <div className="space-y-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
                Skills & Technologies
              </h2>
              <p className="text-xs text-black">
                {skills.map((s) => s.name).join(', ')}
              </p>
            </div>
          )}
          {sectionVisibility.projects && projects.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
                Key Projects
              </h2>
              <div className="space-y-2">
                {projects.map((proj) => (
                  <div key={proj.id} className="text-xs text-black space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>{proj.title}</span>
                      {proj.link && <span>{proj.link}</span>}
                    </div>
                    {proj.description && <p>{proj.description}</p>}
                    {proj.technologies && <p>Technologies: {proj.technologies}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {sectionVisibility.certifications && certifications.length > 0 && (
            <div className="space-y-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
                Certifications
              </h2>
              <div className="space-y-1 text-xs text-black">
                {certifications.map((cert) => (
                  <div key={cert.id} className="flex justify-between">
                    <span><strong>{cert.name}</strong>{cert.issuer ? ` — ${cert.issuer}` : ''}</span>
                    <span>{cert.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sectionVisibility.languages && languages.length > 0 && (
            <div className="space-y-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
                Languages
              </h2>
              <p className="text-xs text-black">
                {languages.map((l) => `${l.language} (${l.proficiency})`).join(', ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
