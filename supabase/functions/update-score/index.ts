import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Get auth user
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'No authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabase.auth.getUser(token)

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Invalid token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Get score from request body
        const { score } = await req.json()

        // Validate score
        if (typeof score !== 'number' || score < 0 || score > 100000) {
            return new Response(
                JSON.stringify({ error: 'Invalid score value' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Get current best score for user
        const { data: currentScore, error: fetchError } = await supabase
            .from('puntuaciones')
            .select('id, best_score')
            .eq('user_id', user.id)
            .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
            // PGRST116 = no rows found, which is fine for new users
            throw fetchError
        }

        let result
        let isNewRecord = false

        if (!currentScore) {
            // First score for this user - insert new record
            const { data, error } = await supabase
                .from('puntuaciones')
                .insert({ user_id: user.id, best_score: score })
                .select()
                .single()

            if (error) throw error
            result = data
            isNewRecord = true
        } else if (score > currentScore.best_score) {
            // New high score - update record
            const { data, error } = await supabase
                .from('puntuaciones')
                .update({ best_score: score, updated_at: new Date().toISOString() })
                .eq('id', currentScore.id)
                .select()
                .single()

            if (error) throw error
            result = data
            isNewRecord = true
        } else {
            // Score not higher than current best
            result = currentScore
            isNewRecord = false
        }

        return new Response(
            JSON.stringify({
                success: true,
                isNewRecord,
                score: result.best_score,
                message: isNewRecord ? '¡Nuevo récord!' : 'Puntuación guardada'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
