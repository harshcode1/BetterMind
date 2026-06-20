'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Video, Wrench, Bookmark, BookmarkCheck, Sparkles, X, ExternalLink, Phone } from 'lucide-react';

const resourcesData = [
  { id: 1,  title: "Understanding Anxiety: A Comprehensive Guide",      category: "Article", link: "https://www.nimh.nih.gov/health/topics/anxiety-disorders",                               tags: ["anxiety", "education"],        conditions: ["anxiety"],         severity: ["mild", "moderate", "severe"] },
  { id: 2,  title: "Meditation for Beginners",                          category: "Video",   link: "https://www.youtube.com/watch?v=inpok4MKVLM",                                           tags: ["meditation", "mindfulness"],   approaches: ["mindfulness"],      severity: ["mild"] },
  { id: 3,  title: "Stress Management Techniques: Tips and Tools",      category: "Article", link: "https://www.helpguide.org/articles/stress/stress-management.htm",                        tags: ["stress", "coping"],            conditions: ["stress", "anxiety"], approaches: ["cbt", "self-care"], severity: ["mild", "moderate"] },
  { id: 4,  title: "Sleep Hygiene Tips",                                category: "Article", link: "https://www.sleepfoundation.org/sleep-hygiene",                                          tags: ["sleep", "insomnia"],           conditions: ["insomnia"],         approaches: ["self-care"],        severity: ["mild", "moderate"] },
  { id: 5,  title: "Cognitive Behavioral Therapy Explained",            category: "Article", link: "https://www.apa.org/ptsd-guideline/patients-and-families/cognitive-behavioral",          tags: ["cbt", "therapy"],             approaches: ["cbt"],              severity: ["moderate", "severe"] },
  { id: 6,  title: "Mood Tracker App Review",                           category: "Tool",    link: "https://www.verywellmind.com/best-mood-tracking-apps-4177953",                           tags: ["mood", "apps"],               approaches: ["self-care"],         severity: ["mild", "moderate"] },
  { id: 7,  title: "Mindfulness Meditation",                            category: "Video",   link: "https://www.youtube.com/watch?v=6p_yaNFSYao",                                           tags: ["mindfulness", "meditation"],   approaches: ["mindfulness"],      severity: ["mild", "moderate"] },
  { id: 8,  title: "Mental Health America Resources",                   category: "Article", link: "https://www.mhanational.org",                                                            tags: ["resources", "support"],        conditions: ["depression", "anxiety", "bipolar"], severity: ["mild", "moderate", "severe"] },
  { id: 9,  title: "Anxiety and Depression Association of America",     category: "Article", link: "https://adaa.org",                                                                        tags: ["anxiety", "depression"],       conditions: ["anxiety", "depression"], severity: ["mild", "moderate", "severe"] },
  { id: 10, title: "Mental Health First Aid",                           category: "Tool",    link: "https://www.mentalhealthfirstaid.org",                                                   tags: ["crisis", "first aid"],         conditions: ["crisis"],           severity: ["severe"] },
  { id: 11, title: "Self-care Practices for Mental Health",             category: "Article", link: "https://psychcentral.com/health/self-care",                                              tags: ["self-care", "wellness"],       approaches: ["self-care"],        severity: ["mild"] },
  { id: 12, title: "7 Tips for Better Mental Health",                   category: "Article", link: "https://www.verywellmind.com/tips-for-better-mental-health-3144881",                    tags: ["tips", "wellness"],            approaches: ["self-care"],        severity: ["mild"] },
  { id: 13, title: "Yoga for Mental Health",                            category: "Video",   link: "https://www.youtube.com/watch?v=v7AYKMP6rOE",                                           tags: ["yoga", "exercise"],            approaches: ["mindfulness"],      severity: ["mild", "moderate"] },
  { id: 14, title: "Art Therapy Explained",                             category: "Article", link: "https://www.healthline.com/health/art-therapy",                                          tags: ["art therapy", "creativity"],   approaches: ["art therapy"],      severity: ["mild", "moderate"] },
  { id: 15, title: "Understanding Depression",                          category: "Article", link: "https://www.webmd.com/depression/guide/what-is-depression",                              tags: ["depression", "education"],     conditions: ["depression"],       severity: ["mild", "moderate", "severe"] },
  { id: 16, title: "Stress Relief Techniques",                          category: "Video",   link: "https://www.youtube.com/watch?v=HJG2tTIxEfk",                                           tags: ["stress", "relief"],            approaches: ["mindfulness"],      severity: ["mild", "moderate"] },
  { id: 17, title: "Mental Health Toolkit (SAMHSA)",                   category: "Tool",    link: "https://www.samhsa.gov",                                                                  tags: ["toolkit", "resources"],        conditions: ["depression", "anxiety"], severity: ["mild", "moderate", "severe"] },
  { id: 18, title: "Mindfulness and Meditation (Mindful.org)",         category: "Article", link: "https://www.mindful.org",                                                                 tags: ["mindfulness", "wellness"],     approaches: ["mindfulness"],      severity: ["mild", "moderate"] },
  { id: 19, title: "Coping with Grief",                                 category: "Article", link: "https://www.helpguide.org/articles/grief/coping-with-grief-and-loss.htm",               tags: ["grief", "coping"],             conditions: ["grief"],            approaches: ["self-care"],        severity: ["moderate", "severe"] },
  { id: 20, title: "Managing Panic Attacks",                            category: "Article", link: "https://www.health.harvard.edu/mind-and-mood/what-to-do-when-youre-in-the-grip-of-a-panic-attack", tags: ["panic", "anxiety"], conditions: ["anxiety", "panic"],  approaches: ["cbt"],              severity: ["moderate", "severe"] },
  { id: 21, title: "Trauma Recovery Resources",                         category: "Article", link: "https://www.nctsn.org",                                                                   tags: ["trauma", "recovery"],          conditions: ["trauma", "ptsd"],   severity: ["moderate", "severe"] },
  { id: 22, title: "Building Resilience",                               category: "Article", link: "https://www.apa.org/topics/resilience",                                                   tags: ["resilience", "strength"],      approaches: ["self-care"],        severity: ["mild", "moderate"] },
  { id: 23, title: "Understanding PTSD",                                category: "Article", link: "https://www.ptsd.va.gov",                                                                 tags: ["ptsd", "trauma"],              conditions: ["ptsd"],             severity: ["moderate", "severe"] },
  { id: 24, title: "Self-help Techniques for Anxiety",                  category: "Article", link: "https://www.verywellmind.com/self-help-strategies-for-anxiety-disorders-2584268",       tags: ["anxiety", "self-help"],        conditions: ["anxiety"],          approaches: ["cbt"],              severity: ["mild", "moderate"] },
  { id: 25, title: "Understanding Bipolar Disorder",                    category: "Article", link: "https://www.nimh.nih.gov/health/topics/bipolar-disorder",                               tags: ["bipolar"],                     conditions: ["bipolar"],          severity: ["moderate", "severe"] },
  { id: 26, title: "Managing OCD",                                      category: "Article", link: "https://iocdf.org",                                                                       tags: ["ocd"],                         conditions: ["ocd"],              approaches: ["cbt"],              severity: ["moderate", "severe"] },
  { id: 27, title: "Meditation for Sleep",                              category: "Video",   link: "https://www.youtube.com/watch?v=aEqlQvczMJQ",                                           tags: ["meditation", "sleep"],         conditions: ["insomnia"],         approaches: ["mindfulness"],      severity: ["mild", "moderate"] },
  { id: 28, title: "Online Therapy Platforms",                          category: "Tool",    link: "https://www.betterhelp.com",                                                              tags: ["therapy", "online"],           approaches: ["therapy"],          severity: ["mild", "moderate", "severe"] },
  { id: 29, title: "Managing Social Anxiety",                           category: "Article", link: "https://adaa.org/understanding-anxiety/social-anxiety-disorder",                        tags: ["social anxiety"],              conditions: ["anxiety"],          approaches: ["cbt"],              severity: ["mild", "moderate"] },
  { id: 30, title: "Coping with Burnout",                               category: "Article", link: "https://hbr.org/2016/11/beating-burnout",                                               tags: ["burnout", "work stress"],      conditions: ["burnout", "stress"], approaches: ["self-care"],       severity: ["moderate"] },
  { id: 31, title: "Digital Tools for Stress (Headspace)",             category: "Tool",    link: "https://www.headspace.com",                                                               tags: ["stress", "apps"],              conditions: ["stress", "anxiety"], approaches: ["mindfulness"],     severity: ["mild", "moderate"] },
  { id: 32, title: "Online Support Groups",                             category: "Tool",    link: "https://www.healthline.com/health/mental-health/online-support-groups",                  tags: ["support groups", "community"], approaches: ["support"],          severity: ["mild", "moderate", "severe"] },
  { id: 33, title: "Benefits of Journaling",                            category: "Article", link: "https://www.healthline.com/health/benefits-of-journaling",                               tags: ["journaling", "self-care"],     approaches: ["self-care"],        severity: ["mild", "moderate"] },
  { id: 34, title: "Cognitive Behavioral Therapy Videos",               category: "Video",   link: "https://www.youtube.com/watch?v=2d--YgFA8xw",                                           tags: ["cbt", "therapy"],             approaches: ["cbt"],              severity: ["mild", "moderate"] },
  { id: 35, title: "Psychology Today: Mental Health",                   category: "Article", link: "https://www.psychologytoday.com/us/basics/mental-health",                               tags: ["psychology", "education"],     conditions: ["depression", "anxiety"], severity: ["mild", "moderate", "severe"] },
  { id: 36, title: "The Role of Exercise in Mental Health",             category: "Article", link: "https://www.verywellfit.com/exercise-and-mental-health-4157062",                        tags: ["exercise", "physical"],        approaches: ["self-care"],        severity: ["mild", "moderate"] },
  { id: 37, title: "Mindfulness-Based Stress Reduction (MBSR)",        category: "Article", link: "https://www.umassmed.edu/cfm/mindfulness-based-programs/mbsr-courses",                  tags: ["mbsr", "stress reduction"],    approaches: ["mindfulness"],      severity: ["mild", "moderate"] },
  { id: 38, title: "Understanding Self-compassion",                     category: "Article", link: "https://self-compassion.org",                                                             tags: ["self-compassion", "self-care"], approaches: ["mindfulness"],     severity: ["mild", "moderate"] },
  { id: 39, title: "Online CBT Resources",                              category: "Tool",    link: "https://www.verywellmind.com/best-online-cbt-therapy-4691256",                          tags: ["cbt", "online"],               approaches: ["cbt"],              severity: ["mild", "moderate"] },
  { id: 40, title: "Comprehensive Guide to Mental Health Apps",         category: "Tool",    link: "https://www.healthline.com/health/mental-health/mental-health-apps",                    tags: ["apps", "technology"],          approaches: ["technology"],       severity: ["mild", "moderate"] },
];

const CATEGORY_META = {
  Article: { icon: BookOpen,  colorClass: 'text-brand-600',  boxClass: 'icon-box-brand', badgeClass: 'badge-brand' },
  Video:   { icon: Video,     colorClass: 'text-rose-500',   boxClass: 'icon-box-rose',  badgeClass: 'badge-rose' },
  Tool:    { icon: Wrench,    colorClass: 'text-mint-600',   boxClass: 'icon-box-mint',  badgeClass: 'badge-mint' },
};

const TABS = [
  { id: 'all',         label: 'All Resources' },
  { id: 'Article',    label: 'Articles' },
  { id: 'Video',      label: 'Videos' },
  { id: 'Tool',       label: 'Tools' },
  { id: 'saved',      label: 'Saved' },
  { id: 'recommended', label: 'For You' },
];

const CRISIS_LINES = [
  { name: 'National Suicide Prevention Lifeline', number: '988',          note: 'Call or text 988 (US)' },
  { name: 'Crisis Text Line',                     number: 'Text HOME to 741741', note: 'US, CA, UK, Ireland' },
  { name: 'International Association for Suicide Prevention', number: 'https://www.iasp.info/resources/Crisis_Centres/', note: 'Find a crisis center' },
];

function ResourceCard({ resource, isSaved, onToggleSave, activeTags, onTagClick }) {
  const meta = CATEGORY_META[resource.category] || CATEGORY_META.Article;
  const Icon = meta.icon;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      className="card p-5 flex flex-col gap-3 h-full"
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`icon-box w-9 h-9 rounded-xl flex-shrink-0 ${meta.boxClass}`}>
          <Icon size={15} className={meta.colorClass} />
        </div>
        <button onClick={() => onToggleSave(resource.id)} className="text-ink-4 hover:text-amber-500 transition-colors mt-0.5 flex-shrink-0">
          {isSaved ? <BookmarkCheck size={17} className="text-amber-500" /> : <Bookmark size={17} />}
        </button>
      </div>

      <div className="flex-1">
        <span className={`badge ${meta.badgeClass} mb-2 inline-flex`}>{resource.category}</span>
        <h3 className="text-sm font-semibold text-ink-1 leading-snug mb-2">{resource.title}</h3>
        {resource.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {resource.tags.slice(0, 3).map(tag => (
              <button key={tag} onClick={() => onTagClick(tag)}
                className={`text-2xs px-2 py-0.5 rounded-full font-medium transition-all ${
                  activeTags.includes(tag) ? 'bg-brand-500 text-white' : 'bg-surface-2 text-ink-3 hover:bg-brand-50 hover:text-brand-600'
                }`}>
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <a href={resource.link} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
        Learn more <ExternalLink size={11} />
      </a>
    </motion.div>
  );
}

export default function ResourcesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [activeTags, setActiveTags] = useState([]);
  const [savedResources, setSavedResources] = useState([]);
  const [recommendedIds, setRecommendedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const popularTags = useMemo(() =>
    [...new Set(resourcesData.flatMap(r => r.tags || []))].slice(0, 12),
    []
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const [assessRes, moodRes] = await Promise.all([
          fetch('/api/assessment?limit=1'),
          fetch('/api/mood?days=30'),
        ]);
        const assessJson = await assessRes.json();
        const moodJson  = await moodRes.json();
        const latest = assessJson.assessments?.[0];
        const needs = [];
        if (latest?.phq9Score >= 10) needs.push('depression');
        if (latest?.gad7Score >= 10) needs.push('anxiety');
        const recentMoods = moodJson.moods || [];
        if (recentMoods.length > 0) {
          const avg = recentMoods.reduce((s, e) => s + e.mood, 0) / recentMoods.length;
          if (avg < 4) needs.push('depression');
        }
        if (needs.length > 0) {
          const ids = resourcesData
            .filter(r => r.conditions?.some(c => needs.includes(c)) || r.approaches?.some(a => ['mindfulness', 'cbt', 'self-care'].includes(a)))
            .slice(0, 9)
            .map(r => r.id);
          setRecommendedIds(ids);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [user]);

  const filtered = useMemo(() => {
    let r = resourcesData;
    if (activeTab === 'saved')       r = r.filter(x => savedResources.includes(x.id));
    else if (activeTab === 'recommended') r = r.filter(x => recommendedIds.includes(x.id));
    else if (activeTab !== 'all')    r = r.filter(x => x.category === activeTab);
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      r = r.filter(x => x.title.toLowerCase().includes(t) || x.tags?.some(g => g.includes(t)));
    }
    if (activeTags.length > 0) r = r.filter(x => x.tags?.some(g => activeTags.includes(g)));
    return r;
  }, [activeTab, searchTerm, activeTags, savedResources, recommendedIds]);

  const toggleTag = (tag) => setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  const toggleSave = (id) => setSavedResources(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="min-h-screen bg-surface-1">

      {/* Hero header */}
      <div className="bg-gradient-to-br from-brand-50 via-surface-1 to-calm-50 border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl mx-auto">
            <span className="badge badge-brand mb-4 inline-flex"><BookOpen size={11} /> Mental Health Library</span>
            <h1 className="font-display font-bold text-3xl text-ink-1 mb-2">Resources for Your Wellbeing</h1>
            <p className="text-ink-3 text-sm leading-relaxed">Curated articles, videos, and tools from trusted sources — personalized to your mental health journey.</p>
          </motion.div>

          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="max-w-xl mx-auto mt-8 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4" />
            <input
              type="text"
              placeholder="Search resources, tags, topics..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input pl-10 pr-4 py-3 shadow-sm"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink-2">
                <X size={15} />
              </button>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Crisis Banner */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mb-8 card p-5 border-l-4 border-l-rose-400 bg-rose-50/40" id="crisis">
          <div className="flex items-start gap-3">
            <div className="icon-box icon-box-rose w-9 h-9 rounded-xl flex-shrink-0">
              <Phone size={15} className="text-rose-500" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-rose-700 text-sm mb-2">Crisis Support — Available 24/7</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {CRISIS_LINES.map(line => (
                  <div key={line.name} className="bg-white rounded-xl p-3 border border-rose-100">
                    <p className="text-xs font-semibold text-ink-1 mb-0.5">{line.name}</p>
                    <p className="text-xs text-rose-600 font-bold">{line.number}</p>
                    <p className="text-2xs text-ink-4 mt-0.5">{line.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Personalized banner */}
        {user && recommendedIds.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mb-6 card p-4 flex items-center gap-3 bg-brand-50 border-brand-100">
            <div className="icon-box icon-box-brand w-9 h-9 rounded-xl flex-shrink-0">
              <Sparkles size={15} className="text-brand-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-700">Personalized picks are ready</p>
              <p className="text-xs text-brand-500">Based on your assessment scores and mood patterns</p>
            </div>
            <button onClick={() => setActiveTab('recommended')} className="btn-soft text-xs flex-shrink-0">View For You</button>
          </motion.div>
        )}

        {/* Tags */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {popularTags.map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)}
                className={`chip ${activeTags.includes(tag) ? 'active' : ''}`}>
                {tag}
              </button>
            ))}
            {activeTags.length > 0 && (
              <button onClick={() => setActiveTags([])} className="chip text-rose-500 border-rose-200 hover:bg-rose-50">
                Clear <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="tab-bar w-fit mb-8 flex-wrap gap-y-1">
          {TABS.filter(t => t.id !== 'recommended' || recommendedIds.length > 0).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}>
              {tab.label}
              {tab.id === 'saved' && savedResources.length > 0 && (
                <span className="ml-1 badge badge-brand text-2xs">{savedResources.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
          </div>
        ) : filtered.length > 0 ? (
          <AnimatePresence mode="popLayout">
            <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(resource => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  isSaved={savedResources.includes(resource.id)}
                  onToggleSave={toggleSave}
                  activeTags={activeTags}
                  onTagClick={toggleTag}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><BookOpen size={28} className="text-ink-4" /></div>
            <h3 className="font-display font-semibold text-ink-1">
              {activeTab === 'saved' ? 'No saved resources yet' : 'No results found'}
            </h3>
            <p className="text-ink-3 text-sm max-w-xs text-center">
              {activeTab === 'saved'
                ? 'Bookmark articles and tools to find them here later.'
                : 'Try a different search or remove some filters.'}
            </p>
            <button onClick={() => { setSearchTerm(''); setActiveTags([]); setActiveTab('all'); }}
              className="btn-soft mt-2">Reset Filters</button>
          </div>
        )}

        {/* Stats footer */}
        <div className="mt-12 pt-8 border-t border-surface-border flex flex-wrap items-center justify-between gap-4">
          <p className="text-ink-4 text-xs">{resourcesData.length} curated resources · Updated regularly</p>
          <p className="text-ink-4 text-xs">Sources: NIH, APA, WHO, Harvard Health, Mind.org and more</p>
        </div>
      </div>
    </div>
  );
}
