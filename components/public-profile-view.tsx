interface PublicProfileData {
  profile: {
    id: string
    full_name: string
    email: string
    city: string | null
    state: string | null
    professional_summary: string | null
    profile_photo_url: string | null
  }
  jobs: Array<{
    id: string
    company_name: string
    job_title: string
    employment_type: string
    start_date: string
    end_date: string | null
    is_current: boolean
    location: string | null
  }>
  references: Array<{
    id: string
    relationship_type: string
    rating: number
    written_feedback: string | null
    from_user: {
      id: string
      full_name: string
      profile_photo_url: string | null
    } | null
    job: {
      id: string
      company_name: string
      job_title: string
    } | null
  }>
  trust_score: {
    score: number
    job_count: number
    reference_count: number
    average_rating: number | null
  } | null
}

export function PublicProfileView({
  profileData,
}: {
  profileData: PublicProfileData
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white dark:bg-[#1A1F2B] p-6 shadow-md">
        <h1 className="text-3xl font-bold text-grey-900">
          {profileData.profile.full_name}
        </h1>
        <p className="mt-2 text-grey-600">{profileData.profile.email}</p>
        {(profileData.profile.city || profileData.profile.state) && (
          <p className="text-grey-600">
            {[profileData.profile.city, profileData.profile.state]
              .filter(Boolean)
              .join(', ')}
          </p>
        )}
        {profileData.profile.professional_summary && (
          <p className="mt-4 text-grey-700">
            {profileData.profile.professional_summary}
          </p>
        )}
        {profileData.trust_score && (
          <div className="mt-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Trust Score: {profileData.trust_score.score.toFixed(1)}/100
            </div>
            <div className="mt-2 text-sm text-grey-600">
              {profileData.trust_score.job_count} jobs •{' '}
              {profileData.trust_score.reference_count} references
              {profileData.trust_score.average_rating && (
                <> • Avg Rating: {profileData.trust_score.average_rating.toFixed(1)}/5.0</>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#1A1F2B] p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold text-grey-900">
          Job History ({profileData.jobs.length})
        </h2>
        <div className="space-y-4">
          {profileData.jobs.map((job) => (
            <div key={job.id} className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-grey-900">
                {job.job_title} at {job.company_name}
              </h3>
              <p className="text-sm text-grey-600">
                {new Date(job.start_date).toLocaleDateString()} -{' '}
                {job.is_current
                  ? 'Present'
                  : job.end_date
                  ? new Date(job.end_date).toLocaleDateString()
                  : 'N/A'}
              </p>
              {job.location && (
                <p className="text-sm text-grey-600">{job.location}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#1A1F2B] p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold text-grey-900">
          Peer References ({profileData.references.length})
        </h2>
        <div className="space-y-4">
          {profileData.references.map((ref) => (
            <div key={ref.id} className="border-b border-gray-200 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-grey-900">
                    {ref.from_user?.full_name || 'Anonymous'}
                  </h3>
                  {ref.job && (
                    <p className="text-sm text-grey-600">
                      {ref.job.job_title} at {ref.job.company_name}
                    </p>
                  )}
                  <p className="text-sm text-grey-600">
                    Relationship: {ref.relationship_type} • Rating:{' '}
                    {ref.rating}/5
                  </p>
                  {ref.written_feedback && (
                    <p className="mt-2 text-grey-700">
                      {ref.written_feedback}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

